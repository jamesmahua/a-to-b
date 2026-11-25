/**
 * The dispatch board's logic, kept free of React and Firebase so it can be
 * unit-tested (dispatch.test.ts). Screens import from here; they don't do maths.
 */
import {
  DRIVER_ASSIGNABLE_STATUSES,
  driverDispatchState,
  minutesSince,
  type Driver,
  type Order,
  type OrderStatus,
  type TimestampLike,
} from '@repo/types'

export type DispatchTab = 'needs_driver' | 'assigned' | 'on_the_way'

export const DISPATCH_TABS: { value: DispatchTab; label: string }[] = [
  { value: 'needs_driver', label: 'Needs a driver' },
  { value: 'assigned', label: 'Driver assigned' },
  { value: 'on_the_way', label: 'On the way' },
]

/**
 * One live listener for the whole board. `out_for_delivery` is included so the
 * "On the way" tab works, and so we know which drivers are really busy.
 */
export const DISPATCH_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready', 'out_for_delivery']

/** An order without a driver turns red after this long, counted from payment. */
export const NO_DRIVER_URGENT_MINUTES = 5

export function tabFor(order: Pick<Order, 'status' | 'driverUid'>): DispatchTab {
  if (order.status === 'out_for_delivery') return 'on_the_way'
  return order.driverUid ? 'assigned' : 'needs_driver'
}

export function canAssign(order: Pick<Order, 'status'>): boolean {
  return DRIVER_ASSIGNABLE_STATUSES.includes(order.status)
}

/** When the order was paid (the clock dispatch cares about). */
export function paidAt(order: Pick<Order, 'timestamps'>): TimestampLike | null {
  return order.timestamps.paidAt ?? order.timestamps.createdAt
}

/**
 * Red card: no driver, and either the food is already waiting at the counter
 * (`ready`), or it's been paid for 5 minutes or more.
 */
export function isUrgent(order: Pick<Order, 'status' | 'driverUid' | 'timestamps'>, now: Date): boolean {
  if (order.driverUid || !canAssign(order)) return false
  if (order.status === 'ready') return true
  const minutes = minutesSince(paidAt(order), now)
  return minutes !== null && minutes >= NO_DRIVER_URGENT_MINUTES
}

const STAGE_RANK: Partial<Record<OrderStatus, number>> = { ready: 0, preparing: 1, pending: 2 }
const ms = (ts: TimestampLike | null) => ts?.toDate().getTime() ?? Number.MAX_SAFE_INTEGER

/**
 * Splits the live list into the three tabs.
 * - Needs a driver: red ones first, then furthest along (ready → preparing → new), then oldest.
 * - Driver assigned: oldest first.
 * - On the way: collected longest ago first.
 */
export function groupDispatch(orders: Order[], now: Date): Record<DispatchTab, Order[]> {
  const groups: Record<DispatchTab, Order[]> = { needs_driver: [], assigned: [], on_the_way: [] }
  for (const order of orders) {
    if (DISPATCH_STATUSES.includes(order.status)) groups[tabFor(order)].push(order)
  }
  groups.needs_driver.sort(
    (a, b) =>
      Number(isUrgent(b, now)) - Number(isUrgent(a, now)) ||
      (STAGE_RANK[a.status] ?? 9) - (STAGE_RANK[b.status] ?? 9) ||
      ms(paidAt(a)) - ms(paidAt(b)),
  )
  groups.assigned.sort((a, b) => ms(paidAt(a)) - ms(paidAt(b)))
  groups.on_the_way.sort((a, b) => ms(a.timestamps.collectedAt) - ms(b.timestamps.collectedAt))
  return groups
}

// ── The assign-driver sheet ───────────────────────────────────────────────────

/** `current` = already on this order. Only `free` drivers can be picked. */
export type DriverOptionState = 'current' | 'free' | 'busy' | 'offline'

export interface DriverOption {
  driver: Driver
  state: DriverOptionState
  /** Works in the store's or the customer's suburb. */
  coversArea: boolean
  /** The order code they're busy with, e.g. "KK-4802". */
  busyWith: string | null
}

/**
 * Every approved driver, ranked for this order: current driver, then free drivers
 * who cover the area, other free drivers, then busy, then offline.
 *
 * `openOrders` is the board's live list. A driver whose `activeOrderId` isn't in
 * it has finished (or lost) that job, so they count as free. `assignDriver()`
 * checks again on the server side of the save.
 */
export function driverOptions(
  order: Pick<Order, 'id' | 'driverUid' | 'storeAddress' | 'deliveryAddress'>,
  drivers: Driver[],
  openOrders: Pick<Order, 'id' | 'code' | 'status'>[],
): DriverOption[] {
  const byId = new Map(openOrders.map((o) => [o.id, o]))
  const area = [order.storeAddress.suburbId, order.deliveryAddress.suburbId]

  const options = drivers.map((driver): DriverOption => {
    const coversArea = driver.operatingSuburbIds.some((s) => area.includes(s))
    if (driver.uid === order.driverUid) return { driver, state: 'current', coversArea, busyWith: null }
    const active = driver.activeOrderId ? byId.get(driver.activeOrderId) : undefined
    const state = driverDispatchState(driver, active?.status ?? null)
    if (state === 'busy') return { driver, state, coversArea, busyWith: active?.code ?? null }
    return { driver, state: state === 'free' ? 'free' : 'offline', coversArea, busyWith: null }
  })

  const rank = (o: DriverOption) =>
    o.state === 'current' ? 0 : o.state === 'free' ? (o.coversArea ? 1 : 2) : o.state === 'busy' ? 3 : 4
  return options.sort((a, b) => rank(a) - rank(b) || a.driver.displayName.localeCompare(b.driver.displayName))
}

/** How many approved drivers could take a job right now (shown at the top of the board). */
export function freeDriverCount(drivers: Driver[], openOrders: Pick<Order, 'id' | 'status'>[]): number {
  const byId = new Map(openOrders.map((o) => [o.id, o.status]))
  return drivers.filter(
    (d) => driverDispatchState(d, d.activeOrderId ? (byId.get(d.activeOrderId) ?? null) : null) === 'free',
  ).length
}

/**
 * Turns a failed assignment into plain language. `DispatchError` comes from
 * `assignDriver()` when the order or driver changed just before the save.
 */
export function dispatchError(error: unknown): string {
  const problem = (error as { problem?: string } | null)?.problem
  const code = (error as { code?: string } | null)?.code
  switch (problem) {
    case 'order_missing':
    case 'order_closed':
      return 'This order has moved on (collected, cancelled or declined), so its driver can’t be changed now.'
    case 'driver_busy':
      return 'That driver has just been given another job. Pick someone else.'
    case 'driver_offline':
      return 'That driver has just gone offline. Pick someone else.'
    case 'driver_not_approved':
    case 'driver_missing':
      return 'That driver can’t take jobs at the moment. Pick someone else.'
  }
  if (code === 'unavailable' || code === 'failed-precondition') {
    return 'No connection right now. Assigning a driver needs to be online, so check your data or Wi-Fi and try again.'
  }
  if (code === 'permission-denied') return 'Only super admins can assign drivers. Try logging out and in again.'
  return 'We couldn’t assign the driver. Please try again.'
}
