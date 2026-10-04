// app/actions/capture-review-actions.ts
// A finished capture, reviewed in the dish's AR section: accepted onto the dish, or put aside.
// The restaurant's owner or a super admin acting for them (`requireCaptureJobAccess`).
'use server'

import { requireCaptureJobAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import * as review from '@/server/capture/review'

/** The owner or a super admin. Parses the capture id; puts its models on the dish and answers their addresses. */
export async function acceptCapture(rawJobId: string) {
  const { restaurantId } = await requireCaptureJobAccess(rawJobId)
  return review.acceptCapture(restaurantId, uuid.parse(rawJobId))
}

/** The same people. Parses the capture id and puts the capture aside. */
export async function discardCapture(rawJobId: string) {
  const { restaurantId } = await requireCaptureJobAccess(rawJobId)
  return review.discardCapture(restaurantId, uuid.parse(rawJobId))
}
