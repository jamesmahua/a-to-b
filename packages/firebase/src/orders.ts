/**
 * Everything that changes an order. Screens call these; they never write
 * order docs directly, so the status rules live in one place.
 */
import {
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Query,
  type Unsubscribe,
  type UpdateData,
} from 'firebase/firestore'
import {
  STATUS_TIMESTAMP_KEY,
  DRIVER_ASSIGNABLE_STATUSES,
  calculateOrderPricing,
  canTransition,
  generateCollectionCode,
  generateOrderCode,
  getCustomerUnitPrice,
  type Address,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PricingConfig,
  type Product,
  type RejectReason,
  type Role,
  type Store,
  type UserProfile,
} from '@repo/types'
import { getDb } from './app'
import { driverRef, orderRef, ordersCol, pricingRef } from './refs'

// ── Placing orders ────────────────────────────────────────────────────────────

export interface BasketLine {
  product: Pick<Product, 'id' | 'name' | 'basePriceCents' | 'storeId'>
  quantity: number
}

export interface PlaceOrderInput {
  customer: Pick<UserProfile, 'uid' | 'firstName'>
  store: Pick<Store, 'id' | 'name' | 'vertical' | 'address'>
  lines: BasketLine[]
  deliveryAddress: Address
  deliveryInstructions?: string | null
  customerNote?: string | null
  tipCents?: number
  /** Shared by all orders from one checkout. Use `newBasketId()` once per checkout. */
  basketId: string
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const snap = await getDoc(pricingRef())
  if (!snap.exists()) throw new Error('Pricing is not set up yet (config/pricing). Run the seed script.')
  return snap.data()
}

export function newBasketId(): string {
  return doc(ordersCol()).id
}

/**
 * Creates one order for one store, in `awaiting_payment`.
 * DEMO: priced on the device. Before real payments this moves to a Cloud Function.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<string> {
  if (input.lines.length === 0) throw new Error('The basket is empty.')
  if (input.lines.some((l) => l.product.storeId !== input.store.id)) {
    throw new Error('Every item in one order must come from the same store.')
  }

  const config = await getPricingConfig()
  const tipCents = input.tipCents ?? 0
  const pricing = calculateOrderPricing(
    input.lines.map((l) => ({ basePriceCents: l.product.basePriceCents, quantity: l.quantity })),
    config,
    tipCents,
  )
  const items: OrderItem[] = input.lines.map((l) => {
    const unitPriceCents = getCustomerUnitPrice(l.product.basePriceCents, config)
    return {
      productId: l.product.id,
      name: l.product.name,
      quantity: l.quantity,
      unitBasePriceCents: l.product.basePriceCents,
      unitPriceCents,
      lineTotalCents: unitPriceCents * l.quantity,
    }
  })

  const ref = doc(ordersCol())
  const order = {
    code: generateOrderCode(),
    basketId: input.basketId,
    customerUid: input.customer.uid,
    customerFirstName: input.customer.firstName,
    storeId: input.store.id,
    storeName: input.store.name,
    storeVertical: input.store.vertical,
    storeAddress: input.store.address,
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    pricing,
    deliveryAddress: input.deliveryAddress,
    deliveryInstructions: input.deliveryInstructions?.trim() || null,
    customerNote: input.customerNote?.trim() || null,
    status: 'awaiting_payment' as const,
    driverUid: null,
    driverFirstName: null,
    collectionCode: generateCollectionCode(),
    payment: { provider: 'demo' as const, status: 'unpaid' as const, reference: null },
    rejectReason: null,
    cancellation: null,
    timestamps: {
      createdAt: serverTimestamp(),
      paidAt: null,
      acceptedAt: null,
      readyAt: null,
      collectedAt: null,
      deliveredAt: null,
      rejectedAt: null,
      cancelledAt: null,
    },
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, order as unknown as Order)
  return ref.id
}

// ── Moving an order along ─────────────────────────────────────────────────────

export class OrderTransitionError extends Error {
  constructor(role: Role, from: OrderStatus, to: OrderStatus) {
    super(`A ${role} can't move an order from "${from}" to "${to}".`)
    this.name = 'OrderTransitionError'
  }
}

/**
 * The one function that changes an order's status. Checks the transition table
 * first (so the app fails fast with a clear message); the rules check it again.
 */
async function moveOrder(
  order: Pick<Order, 'id' | 'status'>,
  to: OrderStatus,
  role: Role,
  extra: UpdateData<Order> = {},
): Promise<void> {
  if (!canTransition(role, order.status, to)) throw new OrderTransitionError(role, order.status, to)
  await updateDoc(orderRef(order.id), {
    ...extra,
    status: to,
    [`timestamps.${STATUS_TIMESTAMP_KEY[to]}`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as UpdateData<Order>)
}

type O = Pick<Order, 'id' | 'status'>

// Customer
/** DEMO: stands in for Peach Payments until the payment Cloud Function exists. */
export const payOrderDemo = (order: O) =>
  moveOrder(order, 'pending', 'customer', { payment: { provider: 'demo', status: 'paid', reference: `DEMO-${order.id}` } })
export const cancelOrderAsCustomer = (order: O, reason: string | null = null) =>
  moveOrder(order, 'cancelled', 'customer', { cancellation: { by: 'customer', reason } })

// Store admin
export const acceptOrder = (order: O) => moveOrder(order, 'preparing', 'store_admin')
export const rejectOrder = (order: O, reason: RejectReason) =>
  moveOrder(order, 'rejected', 'store_admin', { rejectReason: reason })
export const markOrderReady = (order: O) => moveOrder(order, 'ready', 'store_admin')

// Driver
export const markOrderCollected = (order: O) => moveOrder(order, 'out_for_delivery', 'driver')
/** Marks delivered and frees the driver for the next job. */
export async function markOrderDelivered(order: O, driverUid: string): Promise<void> {
  await moveOrder(order, 'delivered', 'driver')
  await updateDoc(driverRef(driverUid), { activeOrderId: null, availability: 'available', updatedAt: serverTimestamp() })
}

// Super admin
export const cancelOrderAsAdmin = (order: O, reason: string) =>
  moveOrder(order, 'cancelled', 'super_admin', { cancellation: { by: 'super_admin', reason } })

/** v1 dispatch: super admin picks the driver (spec §9). Updates the order and the driver together. */
export async function assignDriver(
  order: Pick<Order, 'id' | 'status' | 'driverUid'>,
  driver: { uid: string; firstName: string },
): Promise<void> {
  if (!DRIVER_ASSIGNABLE_STATUSES.includes(order.status)) {
    throw new Error(`Drivers can only be assigned while an order is ${DRIVER_ASSIGNABLE_STATUSES.join(', ')}.`)
  }
  const batch = writeBatch(getDb())
  batch.update(orderRef(order.id), {
    driverUid: driver.uid,
    driverFirstName: driver.firstName,
    updatedAt: serverTimestamp(),
  })
  batch.update(driverRef(driver.uid), { activeOrderId: order.id, availability: 'on_delivery', updatedAt: serverTimestamp() })
  if (order.driverUid && order.driverUid !== driver.uid) {
    batch.update(driverRef(order.driverUid), { activeOrderId: null, availability: 'available', updatedAt: serverTimestamp() })
  }
  await batch.commit()
}

// ── Live lists (real-time) ────────────────────────────────────────────────────

type Listener = (orders: Order[]) => void
type ErrorListener = (error: Error) => void

const listen = (q: Query<Order>, onData: Listener, onError?: ErrorListener): Unsubscribe =>
  onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  )

/** Store admin's live board. Pass the statuses for the tab, e.g. ['pending']. */
export const watchStoreOrders = (storeId: string, statuses: OrderStatus[], onData: Listener, onError?: ErrorListener) =>
  listen(
    query(
      ordersCol(),
      where('storeId', '==', storeId),
      where('status', 'in', statuses),
      orderBy('timestamps.createdAt', 'desc'),
      limit(50),
    ),
    onData,
    onError,
  )

/** Customer's orders, newest first. */
export const watchCustomerOrders = (customerUid: string, onData: Listener, onError?: ErrorListener) =>
  listen(
    query(ordersCol(), where('customerUid', '==', customerUid), orderBy('timestamps.createdAt', 'desc'), limit(20)),
    onData,
    onError,
  )

/** Driver's jobs, newest first. */
export const watchDriverOrders = (driverUid: string, onData: Listener, onError?: ErrorListener) =>
  listen(
    query(ordersCol(), where('driverUid', '==', driverUid), orderBy('timestamps.createdAt', 'desc'), limit(20)),
    onData,
    onError,
  )

/** Super admin: everything in the given statuses (e.g. ready orders needing a driver). */
export const watchOrdersByStatus = (statuses: OrderStatus[], onData: Listener, onError?: ErrorListener) =>
  listen(
    query(ordersCol(), where('status', 'in', statuses), orderBy('timestamps.createdAt', 'desc'), limit(100)),
    onData,
    onError,
  )

/** One order, live (tracking screen). */
export const watchOrder = (orderId: string, onData: (order: Order | null) => void, onError?: ErrorListener) =>
  onSnapshot(
    orderRef(orderId),
    (snap) => onData(snap.exists() ? snap.data() : null),
    (err) => onError?.(err),
  )
