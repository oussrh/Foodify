import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/lib/api'
import { AuthError, requireOrderingStaff } from '@/lib/auth-guard'
import { MAX_LINES } from '@/lib/cart'
import type { Locale, Money } from '@/lib/menu'
import { sumPrices } from '@/lib/money'
import { orderConfirmationText } from '@/lib/order-message'
import { orderInput, type OrderInput, type PlacedOrder } from '@/lib/schemas/order'
import { sendSms } from '@/lib/sms'
import { afterResponse } from '@/server/after-response'
import { log } from '@/server/log'
import { pushNewOrder } from '@/server/order-push'

type PricedDish = { id: string; nameEn: string; nameFr: string; price: { toFixed(digits: number): string } }

/** The order's lines as the row stores them: the dish's name and unit price copied now, so a later edit leaves the order as placed; the guest's note rides along. */
function priceLines(lines: OrderInput['lines'], dishes: PricedDish[]) {
  const byId = new Map(dishes.map((d) => [d.id, d]))
  return lines.flatMap((line) => {
    const dish = byId.get(line.dishId)
    if (!dish) return []
    return [{ dishId: dish.id, nameEn: dish.nameEn, nameFr: dish.nameFr, unitPrice: dish.price.toFixed(2), quantity: line.quantity, note: line.note || null }]
  })
}

type Restaurant = { name: string; defaultLocale: string; currency: string | null; currencySymbol: string | null }

/**
 * Who is placing this order: a member of the restaurant's staff, or a guest on their own phone.
 * A waiter or a manager signed in to this restaurant is stamped on the order and need give no
 * phone number; everyone else is a guest, whatever the body says, and must.
 */
async function placedBy(restaurantId: string): Promise<string | null> {
  try {
    const staff = await requireOrderingStaff(restaurantId)
    return staff.id
  } catch (error) {
    if (error instanceof AuthError) return null
    throw error
  }
}

/**
 * Texts the guest their confirmation, in the language they were reading. Nothing here can fail the
 * order: the message is sent after the row exists, the send reports rather than throws, and an
 * unlinked Brevo account simply sends nothing (lib/sms.ts).
 */
async function confirmByText(order: PlacedOrder, phone: string, restaurant: Restaurant, locale: Locale | undefined) {
  const language: Locale = locale ?? (restaurant.defaultLocale === 'fr' ? 'fr' : 'en')
  const money: Money = { locale: language, symbol: restaurant.currencySymbol || '$', code: restaurant.currency }
  const { sent } = await sendSms({ to: phone, text: orderConfirmationText(order, restaurant.name, language, money) })
  if (!sent) log.info({ orderId: order.id }, 'order: placed, confirmation not sent')
}

/**
 * Why the dishes an order asked for were not all orderable, named so the guest can act on it. A
 * refusal that says "the menu has changed" and nothing else leaves them re-sending the same order
 * and failing the same way; this says "Chicken Couscous has just sold out".
 */
async function refusedDishes(restaurantId: string, asked: string[], priced: readonly { dishId: string }[]) {
  const got = new Set(priced.map((line) => line.dishId))
  const missing = asked.filter((id) => !got.has(id))
  const rows = await prisma.dish.findMany({
    where: { id: { in: missing }, restaurantId },
    select: { id: true, nameEn: true, nameFr: true, soldOutUntil: true },
    take: MAX_LINES,
  })
  // A dish of another restaurant, or one deleted outright, is in `missing` but not in `rows`: it
  // has no name to give, and "off the menu" is all that can honestly be said about it.
  return missing.map((id) => {
    const row = rows.find((dish) => dish.id === id)
    return {
      dishId: id,
      nameEn: row?.nameEn ?? null,
      nameFr: row?.nameFr ?? null,
      reason: row && row.soldOutUntil && row.soldOutUntil > new Date() ? ('sold_out' as const) : ('off_menu' as const),
    }
  })
}

/**
 * The dishes of this order that may actually be ordered: this restaurant's, on the menu, and not
 * sold out. A dish the kitchen has run out of is refused here and not only hidden from the menu's
 * add button, because a cart is built in the guest's browser and can be minutes old by the time
 * it is sent — a waiter's tab older still.
 */
function orderableDishes(restaurantId: string, dishIds: string[]) {
  return prisma.dish.findMany({
    where: {
      id: { in: dishIds },
      restaurantId,
      isActive: true,
      OR: [{ soldOutUntil: null }, { soldOutUntil: { lte: new Date() } }],
    },
    select: { id: true, nameEn: true, nameFr: true, price: true },
    take: MAX_LINES,
  })
}

/**
 * POST, public: the guest menu sends an order with no session. Body as `orderInput` says (the restaurant, the table, a
 * phone for the confirmation, a note for the order, one to fifty lines of dish id, quantity and the note asked for on
 * that dish); every line is re-priced from the database, never from the body. A guest must give a phone and is texted
 * once the row exists (a send can only fail to arrive, never to be stored); a waiter or manager signed in to this
 * restaurant may leave it out, and the order records who took it instead (`placedById`). Answers 201 `{ data: { id, number, table, subtotal } }`; 400 invalid_json or invalid_payload (the issues);
 * 409 unavailable, naming each dish that is not this restaurant's active menu or has sold out (`reason`: `off_menu` or `sold_out`), because the
 * request was well formed and the kitchen's answer changed under it; 403 forbidden when the restaurant has ordering off, 404 not_found for an
 * unknown restaurant, 500 internal. A placed order is pushed to the restaurant's kitchen boards after the response (server/order-push.ts). The number is per restaurant, from `Restaurant.nextOrderNumber` (an order that
 * fails after the increment leaves a gap, never a duplicate). Nothing rate-limits: every accepted call is an order.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('invalid_json', 'The body is not JSON', 400)
  }
  const parsed = orderInput.safeParse(body)
  if (!parsed.success) {
    return fail('invalid_payload', 'Invalid order payload', 400, parsed.error.issues)
  }
  const { restaurantId, table, phone, locale, note, lines } = parsed.data

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, code: true, orderingEnabled: true, currency: true, currencySymbol: true, name: true, defaultLocale: true },
    })
    if (!restaurant) return fail('not_found', 'Restaurant not found', 404)
    if (!restaurant.orderingEnabled) return fail('forbidden', 'This restaurant is not taking orders', 403)

    // A guest orders for themselves and is texted; a waiter orders at the table and is recorded.
    const staffId = await placedBy(restaurantId)
    if (!staffId && !phone) return fail('invalid_payload', 'A phone number is required', 400)

    const dishes = await orderableDishes(restaurantId, lines.map((l) => l.dishId))
    const priced = priceLines(lines, dishes)
    if (priced.length !== lines.length) {
      // 409, not 400: the request was well formed and the kitchen's answer changed under it.
      const refused = await refusedDishes(restaurantId, lines.map((l) => l.dishId), priced)
      return fail('unavailable', 'A dish is not on this menu, or has sold out', 409, refused)
    }
    const subtotal = sumPrices(priced.map((p) => ({ price: p.unitPrice, quantity: p.quantity })))

    const { nextOrderNumber } = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true },
    })
    const order = await prisma.order.create({
      data: {
        restaurantId,
        number: nextOrderNumber - 1,
        table,
        phone: phone ?? '',
        placedById: staffId,
        note: note || null,
        subtotal,
        currency: restaurant.currency,
        lines: { create: priced },
      },
      select: { id: true, number: true, table: true, subtotal: true },
    })
    const placed: PlacedOrder = { id: order.id, number: order.number, table: order.table, subtotal: order.subtotal.toFixed(2) }
    // The kitchen boards are woken once the guest has their answer: a slow push service never holds it.
    afterResponse(() => pushNewOrder(restaurant, { ...placed, lines: priced }))
    // Only a guest is texted: an order taken at the table has nobody to confirm it to.
    if (phone) await confirmByText(placed, phone, restaurant, locale)
    return ok(placed, { status: 201 })
  } catch (error) {
    log.error({ err: error, restaurantId }, 'order: not placed')
    return fail('internal', 'Failed to place the order', 500)
  }
}
