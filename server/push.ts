// server/push.ts
// Web Push to the staff apps: a new order wakes the kitchen boards, a ready one a waiter's phone,
// with the app in the background or the screen locked (public/staff-sw.js shows it). Without the
// VAPID trio (serverEnv.webPush) nothing is sent and that is said once, the way lib/sms.ts treats
// an unlinked Brevo. Nothing here throws: a push is a courtesy on top of the board's own poll,
// and an order is never refused, nor a move undone, over one. A record names the subscription by
// id and the push service's status, never the endpoint (a capability URL; server/log.ts redacts it).
import { sendNotification, WebPushError } from 'web-push'
import { serverEnv } from '@/lib/env'
import prisma from '@/lib/prisma'
import type { PushKind, PushPayload } from '@/lib/push-message'
import type { StaffPushApp } from '@/lib/schemas/push'
import { log } from '@/server/log'

// How long a push service holds one for a device that is off: past this a new order is on the
// board already and a ready plate has gone cold or been carried, so a late alert only misleads.
// A request is answered on the board within minutes or not at all; an answer is news only while
// the waiter is still at the table.
const TTL_SECONDS: Record<PushKind, number> = { order: 600, ready: 300, request: 600, answer: 300 }
// A socket that has said nothing for this long is not going to; a send runs after the response.
const SOCKET_TIMEOUT_MS = 10_000
// One restaurant's devices for one app; a bound, not a limit anybody should meet.
const MAX_DEVICES = 200
// The push service's answers that mean "this subscription no longer exists".
const GONE = new Set([404, 410])

type Vapid = { publicKey: string; privateKey: string; subject: string }
type Device = { id: string; endpoint: string; p256dh: string; auth: string }

let reportedOff = false

/** Sends to one device; a gone subscription is deleted, a success stamped. Answers whether it was delivered. */
async function deliver(device: Device, payload: PushPayload, vapid: Vapid): Promise<boolean> {
  try {
    await sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } }, JSON.stringify(payload), {
      vapidDetails: vapid,
      TTL: TTL_SECONDS[payload.kind],
      urgency: 'high',
      timeout: SOCKET_TIMEOUT_MS,
    })
    await prisma.pushSubscription.updateMany({ where: { id: device.id }, data: { lastUsedAt: new Date() } })
    return true
  } catch (error) {
    const status = error instanceof WebPushError ? error.statusCode : null
    if (status !== null && GONE.has(status)) {
      await prisma.pushSubscription.deleteMany({ where: { id: device.id } })
      log.info({ subscriptionId: device.id, status }, 'push: subscription gone, removed')
    } else {
      log.warn({ subscriptionId: device.id, status }, 'push: not delivered')
    }
    return false
  }
}

/**
 * Pushes `payload` to every device of `restaurantId` subscribed for `app` whose user still works
 * that restaurant (assigned to it, or a super admin): a person removed from a restaurant stops
 * being woken by it at once, whether or not their device ever unsubscribes. `opts.userId` narrows
 * it to one person's devices. Answers how many were delivered; never throws.
 */
export async function sendPush(restaurantId: string, app: StaffPushApp, payload: PushPayload, opts: { userId?: string } = {}): Promise<{ sent: number }> {
  try {
    const vapid = serverEnv.webPush
    if (!vapid) {
      if (!reportedOff) log.info('push: VAPID keys not set, no push sent')
      reportedOff = true
      return { sent: 0 }
    }
    const devices = await prisma.pushSubscription.findMany({
      where: {
        restaurantId,
        app,
        ...(opts.userId ? { userId: opts.userId } : {}),
        user: { OR: [{ role: 'SUPER_ADMIN' }, { restaurants: { some: { id: restaurantId } } }] },
      },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
      take: MAX_DEVICES,
    })
    const delivered = await Promise.all(devices.map((device) => deliver(device, payload, vapid)))
    return { sent: delivered.filter(Boolean).length }
  } catch (error) {
    log.error({ err: error, restaurantId, app }, 'push: not sent')
    return { sent: 0 }
  }
}
