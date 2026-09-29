// server/print/poll.ts
// A printer's two calls (Epson Server Direct Print): a poll takes its due jobs, and a result says
// what became of them. A job is due when it is waiting, or when it was handed out and never
// answered for within SENT_LEASE_MS (lib/print/job-rules.ts): the printer lost power mid-ticket,
// or its answer never came. Due jobs are taken with `FOR UPDATE SKIP LOCKED`, so two polls that
// overlap never hand out the same job. A job handed out again uses an attempt; one out of
// attempts fails and waits for Reprint.
import { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import type { EposResult } from '@/lib/print/epos-response'
import { afterResult, codeMessage, JOBS_PER_POLL, MAX_ATTEMPTS, SENT_LEASE_MS } from '@/lib/print/job-rules'
import { hashSecret } from '@/server/secret'

/** What a job not answered for is marked with when it runs out of attempts. */
const NO_ANSWER = 'No answer from the printer'
/** How often a printer's last poll is written: a printer polls every few seconds, and the settings only need to know it is alive. */
const SEEN_EVERY_MS = 30_000

/**
 * The printer whose secret is `token`, or null, and it is noted as seen at `now` (at most once
 * per SEEN_EVERY_MS, so a poll every five seconds is not a write every five seconds).
 */
export async function printerByToken(token: string, now: Date): Promise<{ id: string } | null> {
  const printer = await prisma.printer.findUnique({ where: { tokenHash: hashSecret(token) }, select: { id: true } })
  if (!printer) return null
  const stale = new Date(now.getTime() - SEEN_EVERY_MS)
  await prisma.printer.updateMany({ where: { id: printer.id, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: stale } }] }, data: { lastSeenAt: now } })
  return printer
}

/**
 * Takes `printerId`'s due jobs at `now`, oldest first and at most JOBS_PER_POLL, and marks them
 * handed out. Answers their ids.
 */
export async function takeDueJobs(printerId: string, now: Date): Promise<string[]> {
  const cutoff = new Date(now.getTime() - SENT_LEASE_MS)
  return prisma.$transaction(async (tx) => {
    await tx.printJob.updateMany({
      where: { printerId, status: 'SENT', sentAt: { lt: cutoff }, attempts: { gte: MAX_ATTEMPTS - 1 } },
      data: { status: 'FAILED', attempts: { increment: 1 }, lastAnswer: NO_ANSWER },
    })
    const rows = await tx.$queryRaw<{ id: string; seq: number }[]>(Prisma.sql`
      UPDATE "PrintJob" SET "attempts" = "attempts" + CASE WHEN "status" = 'SENT' THEN 1 ELSE 0 END, "status" = 'SENT', "sentAt" = ${now}
      WHERE "id" IN (
        SELECT "id" FROM "PrintJob"
        WHERE "printerId" = ${printerId} AND ("status" = 'PENDING' OR ("status" = 'SENT' AND "sentAt" < ${cutoff}))
        ORDER BY "seq"
        LIMIT ${JOBS_PER_POLL}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "seq"`)
    return rows.sort((a, b) => a.seq - b.seq).map((row) => row.id)
  })
}

/** The job a result names (`J<seq>`), or null when it names none. */
function seqOf(jobId: string | null): number | null {
  const match = jobId ? /^J(\d+)$/.exec(jobId) : null
  return match ? Number(match[1]) : null
}

/** Applies one result to the handed-out jobs it covers: the one it names, or all of them for a result without an id. */
async function applyResult(tx: Prisma.TransactionClient, printerId: string, result: EposResult, now: Date): Promise<void> {
  const seq = seqOf(result.jobId)
  const jobs = await tx.printJob.findMany({ where: { printerId, status: 'SENT', ...(seq === null ? {} : { seq }) }, select: { id: true, attempts: true } })
  for (const job of jobs) {
    const next = afterResult(result.success, result.code, job.attempts + 1)
    const answer = result.success ? null : codeMessage(result.code)
    if (next === 'PRINTED') await tx.printJob.update({ where: { id: job.id }, data: { status: 'PRINTED', printedAt: now, lastAnswer: null }, select: { id: true } })
    else if (next === 'WAIT') await tx.printJob.update({ where: { id: job.id }, data: { status: 'PENDING', lastAnswer: answer }, select: { id: true } })
    else await tx.printJob.update({ where: { id: job.id }, data: { status: next === 'FAILED' ? 'FAILED' : 'PENDING', attempts: { increment: 1 }, lastAnswer: answer }, select: { id: true } })
  }
}

/**
 * Records a printer's results: each handed-out job it covers is printed, waits (the printer needs
 * a person), is retried or fails. The printer's last error follows the last result: cleared by a
 * success, set by a failure. A result for a job no longer handed out changes nothing.
 */
export async function recordResults(printerId: string, results: EposResult[], now: Date): Promise<void> {
  if (results.length === 0) return
  await prisma.$transaction(async (tx) => {
    for (const result of results) await applyResult(tx, printerId, result, now)
    const last = results[results.length - 1]
    await tx.printer.update({ where: { id: printerId }, data: { lastError: last && !last.success ? codeMessage(last.code) : null }, select: { id: true } })
  })
}
