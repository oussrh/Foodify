// server/change-push.ts
// The floor's requests to the pass, and the pass's answers back: a waiter asking to take something
// off a ticket being cooked wakes the restaurant's kitchen boards, and the kitchen's answer wakes
// the phones of the waiter who asked, and only theirs. Each runs after the response
// (server/after-response.ts) and reports rather than throws, like server/order-push.ts.
import { serverEnv } from '@/lib/env'
import prisma from '@/lib/prisma'
import { changeAnswerPush, changeRequestPush, type PushRequest } from '@/lib/push-message'
import { sendPush } from '@/server/push'

/** One change as a push names it: the ticket's number and table, the dish (never the guest's note), who asked. */
async function readChange(changeId: string) {
  const change = await prisma.orderChange.findUnique({
    where: { id: changeId },
    select: {
      id: true,
      status: true,
      quantity: true,
      requestedById: true,
      restaurantId: true,
      restaurant: { select: { code: true } },
      order: { select: { number: true, table: true } },
      line: { select: { nameEn: true } },
    },
  })
  if (!change) return null
  const request: PushRequest = { changeId: change.id, orderNumber: change.order.number, table: change.order.table, dish: change.line?.nameEn ?? null, quantity: change.quantity }
  return { change, request, restaurant: { id: change.restaurantId, code: change.restaurant.code } }
}

/** A request from the floor, to every kitchen board of the restaurant. With push off, nothing is read. */
export async function pushChangeRequest(changeId: string): Promise<{ sent: number }> {
  if (!serverEnv.webPush) return { sent: 0 }
  const read = await readChange(changeId)
  if (!read) return { sent: 0 }
  return sendPush(read.restaurant.id, 'board', changeRequestPush(read.request, read.restaurant))
}

/** The kitchen's answer, to the waiter phones of whoever asked; nobody else's phone is woken by it. */
export async function pushChangeAnswer(changeId: string): Promise<{ sent: number }> {
  if (!serverEnv.webPush) return { sent: 0 }
  const read = await readChange(changeId)
  if (!read || !read.change.requestedById || read.change.status === 'PENDING') return { sent: 0 }
  const payload = changeAnswerPush(read.request, read.change.status === 'APPLIED', read.restaurant)
  return sendPush(read.restaurant.id, 'waiter', payload, { userId: read.change.requestedById })
}

/** Each of the answers in `changeIds`, to whoever asked; how many devices were woken in all. */
export async function pushChangeAnswers(changeIds: readonly string[]): Promise<{ sent: number }> {
  const sent = await Promise.all(changeIds.map((id) => pushChangeAnswer(id)))
  return { sent: sent.reduce((total, one) => total + one.sent, 0) }
}
