/**
 * Order tracking, as a pure function: order in → what the customer should see out.
 *
 * Why keep this out of the screen? The screen only has to draw what this returns,
 * and every status can be tested here without Firebase or a phone.
 */
import { REJECT_REASON_LABELS, type Order, type OrderStatus, type OrderTimestamps } from '@repo/types'

/** done = happened · current = happening now · upcoming = still to come · skipped = won't happen (order ended) */
export type StepState = 'done' | 'current' | 'upcoming' | 'skipped'

export interface TrackingStep {
  key: 'paid' | 'accepted' | 'ready' | 'collected' | 'delivered'
  label: string
  state: StepState
  /** When it happened, if it has. */
  at: Date | null
}

export interface Tracking {
  /** Big line at the top, e.g. "Kasi Kota Corner is preparing your order" */
  headline: string
  /** Smaller line under it, or null. */
  detail: string | null
  steps: TrackingStep[]
  /** True once nothing more will happen (delivered, rejected or cancelled). */
  finished: boolean
  /** True when it ended badly, so the screen can colour it differently. */
  problem: boolean
}

/** The five milestones, in order, and the timestamp that marks each one. */
const MILESTONES: { key: TrackingStep['key']; label: string; stamp: keyof OrderTimestamps }[] = [
  { key: 'paid', label: 'Order placed', stamp: 'paidAt' },
  { key: 'accepted', label: 'Store accepted', stamp: 'acceptedAt' },
  { key: 'ready', label: 'Packed and ready', stamp: 'readyAt' },
  { key: 'collected', label: 'On the way', stamp: 'collectedAt' },
  { key: 'delivered', label: 'Delivered', stamp: 'deliveredAt' },
]

/** How many milestones each status has completed. */
const DONE_COUNT: Record<OrderStatus, number> = {
  awaiting_payment: 0,
  pending: 1,
  preparing: 2,
  ready: 3,
  out_for_delivery: 4,
  delivered: 5,
  rejected: 1, // the store said no after payment
  cancelled: 0, // worked out from the timestamps below
}

export function getTracking(order: Pick<Order, 'status' | 'storeName' | 'driverFirstName' | 'rejectReason' | 'cancellation' | 'timestamps'>): Tracking {
  const { status, storeName, timestamps } = order
  const ended = status === 'rejected' || status === 'cancelled'

  // A cancelled order could have stopped at any point: count the milestones that really happened.
  const doneCount =
    status === 'cancelled' ? MILESTONES.filter((m) => timestamps[m.stamp] != null).length : DONE_COUNT[status]

  const steps: TrackingStep[] = MILESTONES.map((m, i) => {
    let state: StepState
    if (i < doneCount) state = 'done'
    else if (ended) state = 'skipped'
    else if (i === doneCount) state = 'current'
    else state = 'upcoming'
    const stamp = timestamps[m.stamp]
    return { key: m.key, label: m.label, state, at: stamp ? stamp.toDate() : null }
  })

  const driver = order.driverFirstName ?? 'Your driver'
  const copy: Record<OrderStatus, [string, string | null]> = {
    awaiting_payment: ['Waiting for payment', 'Your order is saved. Finish paying to send it to the store.'],
    pending: [`Waiting for ${storeName} to accept`, 'This usually takes a few minutes.'],
    preparing: [`${storeName} is preparing your order`, order.driverFirstName ? `${driver} will collect it.` : null],
    ready: ['Packed and waiting for the driver', order.driverFirstName ? `${driver} is on the way to the store.` : null],
    out_for_delivery: [`${driver} is on the way`, 'Keep your phone nearby.'],
    delivered: ['Delivered. Enjoy! 🎉', null],
    rejected: [
      `${storeName} couldn’t take this order`,
      order.rejectReason ? `Reason: ${REJECT_REASON_LABELS[order.rejectReason]}.` : null,
    ],
    cancelled: [
      'Order cancelled',
      order.cancellation?.by === 'customer' ? 'You cancelled this order.' : 'Klick&Kolleka cancelled this order.',
    ],
  }
  const [headline, detail] = copy[status]

  return { headline, detail, steps, finished: ended || status === 'delivered', problem: ended }
}
