/**
 * The live orders board's logic, kept free of React and Firebase so it can be
 * unit-tested (board.test.ts). Screens import from here; they don't do maths.
 */
import { ORDER_STATUS_LABELS, formatWaiting, minutesSince, type Order, type OrderItem, type OrderStatus, type TimestampLike } from '@repo/types'

export type BoardTab = 'new' | 'preparing' | 'ready'

/** The three tabs, and which order status each one shows. */
export const BOARD_TABS: { value: BoardTab; label: string; status: OrderStatus }[] = [
  { value: 'new', label: ORDER_STATUS_LABELS.pending, status: 'pending' }, // "New order"
  { value: 'preparing', label: ORDER_STATUS_LABELS.preparing, status: 'preparing' },
  { value: 'ready', label: 'Ready', status: 'ready' },
]

/** One live listener covers all three tabs (cheaper than three listeners). */
export const BOARD_STATUSES: OrderStatus[] = BOARD_TABS.map((t) => t.status)

/** A new order still waiting this long gets a red "waiting" tag. */
export const NEW_ORDER_URGENT_MINUTES = 5

/**
 * When the order entered its current stage. That's what the store cares about:
 * how long a new order has been waiting, how long it has been cooking, etc.
 */
export function stageStartedAt(order: Pick<Order, 'status' | 'timestamps'>): TimestampLike | null {
  const t = order.timestamps
  switch (order.status) {
    case 'pending':
      return t.paidAt ?? t.createdAt
    case 'preparing':
      return t.acceptedAt
    case 'ready':
      return t.readyAt
    default:
      return null
  }
}

// Moved to @repo/types so the super admin app shares them. Re-exported so imports here keep working.
export { formatWaiting, minutesSince }

export function isUrgent(order: Pick<Order, 'status' | 'timestamps'>, now: Date): boolean {
  if (order.status !== 'pending') return false
  const minutes = minutesSince(stageStartedAt(order), now)
  return minutes !== null && minutes >= NEW_ORDER_URGENT_MINUTES
}

/**
 * Splits the live list into the three tabs, oldest first in each,
 * so the order that has waited longest is always at the top.
 */
export function groupByTab(orders: Order[]): Record<BoardTab, Order[]> {
  const groups: Record<BoardTab, Order[]> = { new: [], preparing: [], ready: [] }
  for (const order of orders) {
    const tab = BOARD_TABS.find((t) => t.status === order.status)
    if (tab) groups[tab.value].push(order)
  }
  const startMs = (o: Order) => stageStartedAt(o)?.toDate().getTime() ?? Number.MAX_SAFE_INTEGER
  for (const list of Object.values(groups)) list.sort((a, b) => startMs(a) - startMs(b))
  return groups
}

/** "New order (2)" — or just "New order" when the tab is empty. */
export function tabLabel(label: string, count: number): string {
  return count > 0 ? `${label} (${count})` : label
}

/** First few lines of the order ("2 × White bread"), plus how many more there are. */
export function itemSummary(items: Pick<OrderItem, 'name' | 'quantity'>[], max = 3): { lines: string[]; more: number } {
  return {
    lines: items.slice(0, max).map((i) => `${i.quantity} × ${i.name}`),
    more: Math.max(0, items.length - max),
  }
}

/**
 * Turns a failed tap into plain language. The usual cause is that the order
 * changed first (e.g. the customer cancelled), so the rules refused the move.
 */
export function boardActionError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  const name = (error as { name?: string } | null)?.name
  if (code === 'permission-denied' || name === 'OrderTransitionError') {
    return 'This order changed before your tap went through, for example the customer cancelled it. The board shows the latest.'
  }
  if (code === 'unavailable') return 'No connection right now. Check your data or Wi-Fi and try again.'
  return 'We couldn’t update this order. Please try again.'
}
