// app/actions/capture-actions.ts
// "Create from a video" in a dish's AR section: the restaurant's owner or a super admin acting for
// them, through the dish (`requireDishAccess`) or the capture's own restaurant
// (`requireCaptureJobAccess`). Accepting and discarding are capture-review-actions.ts.
'use server'

import { requireCaptureJobAccess, requireDishAccess } from '@/lib/auth-guard'
import { uuid } from '@/lib/schemas/common'
import { captureRequest, type CaptureRequest } from '@/lib/schemas/capture'
import * as captures from '@/server/capture/jobs'

/** The owner or a super admin. Parses the dish id; answers whether capture is on, and the dish's open capture. */
export async function getDishCapture(rawDishId: string) {
  const { restaurantId } = await requireDishAccess(rawDishId)
  return captures.dishCaptureState(restaurantId, uuid.parse(rawDishId))
}

/** The same people. Parses `captureRequest`; answers the new capture and the address its video is sent to. */
export async function createCapture(raw: CaptureRequest) {
  const { restaurantId } = await requireDishAccess(raw.dishId)
  return captures.createCapture(restaurantId, captureRequest.parse(raw))
}

/** The same people. Parses the capture id and tells the engine to begin, once the video is sent. */
export async function startCapture(rawJobId: string) {
  const { restaurantId } = await requireCaptureJobAccess(rawJobId)
  return captures.startCapture(restaurantId, uuid.parse(rawJobId))
}

/** The same people. Parses the capture id; answers where the capture is, asking the engine while it works. */
export async function refreshCapture(rawJobId: string) {
  const { restaurantId } = await requireCaptureJobAccess(rawJobId)
  return captures.refreshCapture(restaurantId, uuid.parse(rawJobId))
}
