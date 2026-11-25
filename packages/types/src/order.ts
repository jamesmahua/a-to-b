import type { Cents, TimestampLike, Vertical } from './common'
import type { Address } from './location'
import type { OrderPricing } from './pricing'
import type { Role } from './roles'

/**
 * Order lifecycle.
 *
 *   awaiting_payment → pending → preparing → ready → out_for_delivery → delivered
 *
 * Other endings: `rejected` (store, from pending) and `cancelled`.
 * Driver assignment is the `driverUid` field, not a status, so super admin can
 * assign a driver while the store is still preparing.
 */
export const ORDER_STATUSES = [
  'awaiting_payment',
  'pending',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const TERMINAL_STATUSES: readonly OrderStatus[] = ['delivered', 'rejected', 'cancelled']

/** Plain-language labels. Each app can override wording, but these are the defaults. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: 'Waiting for payment',
  pending: 'New order',
  preparing: 'Preparing',
  ready: 'Ready for collection',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  rejected: 'Declined by store',
  cancelled: 'Cancelled',
}

/**
 * Who may move an order from one status to the next.
 * This table is the single source of truth: the apps use it to show buttons,
 * and firestore.rules enforces the same table (keep them in step).
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, Partial<Record<OrderStatus, readonly Role[]>>> = {
  awaiting_payment: {
    // DEMO: customer "pays" with the demo button. Real payments: a Cloud Function
    // handling the Peach webhook makes this move, and the customer permission goes.
    pending: ['customer', 'super_admin'],
    cancelled: ['customer', 'super_admin'],
  },
  pending: {
    preparing: ['store_admin', 'super_admin'],
    rejected: ['store_admin', 'super_admin'],
    cancelled: ['customer', 'super_admin'],
  },
  preparing: {
    ready: ['store_admin', 'super_admin'],
    cancelled: ['super_admin'],
  },
  ready: {
    out_for_delivery: ['driver', 'super_admin'],
    cancelled: ['super_admin'],
  },
  out_for_delivery: {
    delivered: ['driver', 'super_admin'],
    cancelled: ['super_admin'],
  },
  delivered: {},
  rejected: {},
  cancelled: {},
}

export function canTransition(role: Role, from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from][to]?.includes(role) ?? false
}

/** The statuses a given role can move this order to right now. Use it to decide which buttons to show. */
export function nextStatusesFor(role: Role, from: OrderStatus): OrderStatus[] {
  return (Object.entries(ORDER_TRANSITIONS[from]) as [OrderStatus, readonly Role[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([to]) => to)
}

/** Which timestamp gets stamped when an order enters each status. */
export const STATUS_TIMESTAMP_KEY: Record<OrderStatus, keyof OrderTimestamps> = {
  awaiting_payment: 'createdAt',
  pending: 'paidAt',
  preparing: 'acceptedAt',
  ready: 'readyAt',
  out_for_delivery: 'collectedAt',
  delivered: 'deliveredAt',
  rejected: 'rejectedAt',
  cancelled: 'cancelledAt',
}

/** Super admin can assign or change a driver while the order is in one of these. */
export const DRIVER_ASSIGNABLE_STATUSES: readonly OrderStatus[] = ['pending', 'preparing', 'ready']

/** Tap-to-choose reasons, so store admins don't have to type. */
export const REJECT_REASONS = ['out_of_stock', 'too_busy', 'closing_soon', 'other'] as const
export type RejectReason = (typeof REJECT_REASONS)[number]

export const REJECT_REASON_LABELS: Record<RejectReason, string> = {
  out_of_stock: 'Out of stock',
  too_busy: 'Too busy right now',
  closing_soon: 'Closing soon',
  other: 'Other reason',
}

/** A snapshot of the product at the time of ordering. Later price changes don't affect it. */
export interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitBasePriceCents: Cents
  /** What the customer paid per unit (store price + markup). */
  unitPriceCents: Cents
  lineTotalCents: Cents
}

export interface OrderTimestamps {
  createdAt: TimestampLike
  paidAt: TimestampLike | null
  acceptedAt: TimestampLike | null
  readyAt: TimestampLike | null
  collectedAt: TimestampLike | null
  deliveredAt: TimestampLike | null
  rejectedAt: TimestampLike | null
  cancelledAt: TimestampLike | null
}

export type PaymentProvider = 'peach' | 'demo'
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded'

/** Reference only. Card details never touch Firestore (spec §9.3). */
export interface OrderPayment {
  provider: PaymentProvider
  status: PaymentStatus
  reference: string | null
}

/**
 * orders/{orderId}
 *
 * One order = one store. A multi-store basket becomes several orders sharing a `basketId`.
 * Store, customer and driver details are copied in, so each screen needs one read.
 */
export interface Order {
  id: string
  /** Human-friendly code shown everywhere, e.g. "KK-4821". Not unique forever; `id` is. */
  code: string
  /** Shared by all orders from one checkout. */
  basketId: string

  customerUid: string
  /** First name only: all the store and driver need. */
  customerFirstName: string

  storeId: string
  storeName: string
  storeVertical: Vertical
  /** Where the driver collects. */
  storeAddress: Address

  items: OrderItem[]
  itemCount: number
  pricing: OrderPricing

  deliveryAddress: Address
  /** "Gate code 1234", "Leave with the neighbour" */
  deliveryInstructions: string | null
  /** Note to the store: "No onions please" */
  customerNote: string | null

  status: OrderStatus
  driverUid: string | null
  driverFirstName: string | null
  /** 4 digits. The driver shows it at pickup so the right driver gets the right bag. */
  collectionCode: string

  payment: OrderPayment
  rejectReason: RejectReason | null
  cancellation: { by: Role; reason: string | null } | null

  timestamps: OrderTimestamps
  updatedAt: TimestampLike
}

/** "KK-4821" */
export function generateOrderCode(random: () => number = Math.random): string {
  return `KK-${Math.floor(1000 + random() * 9000)}`
}

/** "0472" */
export function generateCollectionCode(random: () => number = Math.random): string {
  return Math.floor(random() * 10000)
    .toString()
    .padStart(4, '0')
}
