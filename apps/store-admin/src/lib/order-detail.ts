/**
 * Logic for the order detail screen, kept free of React and Firebase so it can
 * be unit-tested (order-detail.test.ts).
 */
import {
  ORDER_STATUS_LABELS,
  REJECT_REASON_LABELS,
  type Cents,
  type Order,
  type OrderStatus,
  type OrderTimestamps,
} from '@repo/types'
import { formatWaiting } from './board'

/** Store-side wording. Same as the shared labels, except "Declined by store" reads oddly to the store itself. */
export const STORE_STATUS_LABELS: Record<OrderStatus, string> = {
  ...ORDER_STATUS_LABELS,
  rejected: 'Declined',
}

export interface StoreLine {
  key: string
  quantity: number
  name: string
  /** The store's own price per unit (no markup). */
  unitCents: Cents
  lineCents: Cents
}

/** Every item at the store's own prices. Uses the snapshot saved on the order, so later price changes don't matter. */
export function storeLines(order: Pick<Order, 'items'>): StoreLine[] {
  return order.items.map((item, i) => ({
    key: `${item.productId}-${i}`,
    quantity: item.quantity,
    name: item.name,
    unitCents: item.unitBasePriceCents,
    lineCents: item.unitBasePriceCents * item.quantity,
  }))
}

export interface MoneyRow {
  label: string
  cents: Cents
  /** Shown as a minus amount. */
  deduction?: boolean
  /** The bottom line, shown bold. */
  total?: boolean
}

/**
 * What the store earns from this order: its prices, minus any commission.
 * The commission row only appears when there is one, so under today's
 * customer-pays model the store just sees "Items" and "You receive".
 */
export function payoutRows(pricing: Pick<Order['pricing'], 'storeSubtotalCents' | 'commissionCents' | 'storePayoutCents'>): MoneyRow[] {
  const rows: MoneyRow[] = [{ label: 'Items at your prices', cents: pricing.storeSubtotalCents }]
  if (pricing.commissionCents > 0) {
    rows.push({ label: 'Klick&Kolleka commission', cents: pricing.commissionCents, deduction: true })
  }
  rows.push({ label: 'You receive', cents: pricing.storePayoutCents, total: true })
  return rows
}

export interface TimelineStep {
  label: string
  at: Date | null
  done: boolean
}

const FLOW: { label: string; key: keyof OrderTimestamps }[] = [
  { label: 'Paid', key: 'paidAt' },
  { label: 'Accepted', key: 'acceptedAt' },
  { label: 'Ready for collection', key: 'readyAt' },
  { label: 'Collected by driver', key: 'collectedAt' },
  { label: 'Delivered', key: 'deliveredAt' },
]

/**
 * The order's history with times. For a normal order every step shows (future
 * ones not done yet). For a declined or cancelled order, only the steps that
 * happened, then how it ended.
 */
export function storeTimeline(order: Pick<Order, 'status' | 'timestamps' | 'rejectReason' | 'cancellation'>): TimelineStep[] {
  const t = order.timestamps
  const steps = FLOW.map((s) => ({ label: s.label, at: t[s.key]?.toDate() ?? null, done: t[s.key] !== null }))

  if (order.status === 'rejected') {
    const reason = order.rejectReason ? ` (${REJECT_REASON_LABELS[order.rejectReason].toLowerCase()})` : ''
    return [...steps.filter((s) => s.done), { label: `Declined by you${reason}`, at: t.rejectedAt?.toDate() ?? null, done: true }]
  }
  if (order.status === 'cancelled') {
    const by = order.cancellation?.by === 'customer' ? 'the customer' : 'Klick&Kolleka'
    return [...steps.filter((s) => s.done), { label: `Cancelled by ${by}`, at: t.cancelledAt?.toDate() ?? null, done: true }]
  }
  return steps
}

/** "21:10" — or "25 Nov, 21:10" when it wasn't today. */
export function formatClock(date: Date, now: Date = new Date()): string {
  const time = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (date.toDateString() === now.toDateString()) return time
  return `${date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}, ${time}`
}

/** "Waiting 6 min", "Preparing for 12 min", "Ready for 2 min". `null` once the order has left the store. */
export function stageText(status: OrderStatus, minutes: number | null): string | null {
  const fresh = minutes === null || minutes < 1
  switch (status) {
    case 'pending':
      return fresh ? 'Just came in' : `Waiting ${formatWaiting(minutes)}`
    case 'preparing':
      return fresh ? 'Accepted just now' : `Preparing for ${formatWaiting(minutes)}`
    case 'ready':
      return fresh ? 'Ready just now' : `Ready for ${formatWaiting(minutes)}`
    default:
      return null
  }
}
