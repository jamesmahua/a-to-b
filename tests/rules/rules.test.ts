/**
 * Security rules tests. Needs the Firestore emulator (Java 21+).
 *   npm run test:rules
 * (starts the emulator, runs these, stops it)
 */
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import { DEFAULT_PRICING, calculateOrderPricing } from '@repo/types'

let env: RulesTestEnvironment

const now = Timestamp.now()
const pricing = calculateOrderPricing([{ basePriceCents: 2000, quantity: 2 }], DEFAULT_PRICING)

const baseUser = (uid: string, role: string, extra: Record<string, unknown> = {}) => ({
  uid,
  role,
  displayName: `${uid} Test`,
  firstName: uid,
  email: `${uid}@test.kk`,
  phone: null,
  suburbId: 'benoni-central',
  storeId: null,
  consent: { termsVersion: '2026-11', acceptedAt: now, marketingOptIn: false },
  createdAt: now,
  updatedAt: now,
  ...extra,
})

const baseStore = (extra: Record<string, unknown> = {}) => ({
  id: 'store1',
  name: 'Spaza One',
  nameLower: 'spaza one',
  vertical: 'essentials',
  description: '',
  ownerUid: 'storeAdmin',
  phone: '0110000000',
  address: { line1: '1 Main Rd', line2: null, suburbId: 'benoni-central', suburbName: 'Benoni Central' },
  deliverySuburbIds: ['benoni-central'],
  approval: 'approved',
  tradingStatus: 'open',
  hours: {},
  categories: [],
  imageUrl: null,
  createdAt: now,
  updatedAt: now,
  ...extra,
})

const emptyStamps = {
  createdAt: now,
  paidAt: null,
  acceptedAt: null,
  readyAt: null,
  collectedAt: null,
  deliveredAt: null,
  rejectedAt: null,
  cancelledAt: null,
}

const baseOrder = (extra: Record<string, unknown> = {}) => ({
  id: 'order1',
  code: 'KK-4821',
  basketId: 'basket1',
  customerUid: 'customer',
  customerFirstName: 'customer',
  storeId: 'store1',
  storeName: 'Spaza One',
  storeVertical: 'essentials',
  storeAddress: baseStore().address,
  items: [
    { productId: 'p1', name: 'Bread', quantity: 2, unitBasePriceCents: 2000, unitPriceCents: 2240, lineTotalCents: 4480 },
  ],
  itemCount: 2,
  pricing,
  deliveryAddress: baseStore().address,
  deliveryInstructions: null,
  customerNote: null,
  status: 'awaiting_payment',
  driverUid: null,
  driverFirstName: null,
  collectionCode: '0472',
  payment: { provider: 'demo', status: 'unpaid', reference: null },
  rejectReason: null,
  cancellation: null,
  timestamps: emptyStamps,
  updatedAt: now,
  ...extra,
})

const as = (uid: string): Firestore => env.authenticatedContext(uid).firestore() as unknown as Firestore
const anon = (): Firestore => env.unauthenticatedContext().firestore() as unknown as Firestore

async function seed(fn: (db: Firestore) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore() as unknown as Firestore))
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-kk',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await seed(async (db) => {
    await setDoc(doc(db, 'config/pricing'), { ...DEFAULT_PRICING, updatedAt: now })
    await setDoc(doc(db, 'users/customer'), baseUser('customer', 'customer'))
    await setDoc(doc(db, 'users/other'), baseUser('other', 'customer'))
    await setDoc(doc(db, 'users/storeAdmin'), baseUser('storeAdmin', 'store_admin', { storeId: 'store1' }))
    await setDoc(doc(db, 'users/otherStoreAdmin'), baseUser('otherStoreAdmin', 'store_admin', { storeId: 'store2' }))
    await setDoc(doc(db, 'users/driver'), baseUser('driver', 'driver'))
    await setDoc(doc(db, 'users/otherDriver'), baseUser('otherDriver', 'driver'))
    await setDoc(doc(db, 'users/admin'), baseUser('admin', 'super_admin'))
    await setDoc(doc(db, 'stores/store1'), baseStore())
    await setDoc(doc(db, 'stores/store2'), baseStore({ id: 'store2', ownerUid: 'otherStoreAdmin' }))
    await setDoc(doc(db, 'stores/pendingStore'), baseStore({ id: 'pendingStore', approval: 'pending' }))
  })
})

// ── Users ────────────────────────────────────────────────────────────────────

describe('users', () => {
  it('lets someone sign up as a customer, driver or store admin', async () => {
    await assertSucceeds(setDoc(doc(as('new1'), 'users/new1'), baseUser('new1', 'customer')))
    await assertSucceeds(setDoc(doc(as('new2'), 'users/new2'), baseUser('new2', 'driver')))
    await assertSucceeds(setDoc(doc(as('new3'), 'users/new3'), baseUser('new3', 'store_admin')))
  })

  it('blocks signing up as super admin', async () => {
    await assertFails(setDoc(doc(as('sneaky'), 'users/sneaky'), baseUser('sneaky', 'super_admin')))
  })

  it('blocks creating someone else’s profile', async () => {
    await assertFails(setDoc(doc(as('new1'), 'users/new2'), baseUser('new2', 'customer')))
  })

  it('blocks changing your own role', async () => {
    await assertFails(updateDoc(doc(as('customer'), 'users/customer'), { role: 'super_admin' }))
    await assertFails(updateDoc(doc(as('driver'), 'users/driver'), { role: 'store_admin' }))
  })

  it('lets you edit your own name', async () => {
    await assertSucceeds(updateDoc(doc(as('customer'), 'users/customer'), { displayName: 'Thabo M' }))
  })

  it('keeps profiles private', async () => {
    await assertSucceeds(getDoc(doc(as('customer'), 'users/customer')))
    await assertFails(getDoc(doc(as('other'), 'users/customer')))
    await assertFails(getDoc(doc(as('storeAdmin'), 'users/customer')))
    await assertSucceeds(getDoc(doc(as('admin'), 'users/customer')))
  })

  it('blocks linking to a store you don’t own', async () => {
    await assertFails(updateDoc(doc(as('storeAdmin'), 'users/storeAdmin'), { storeId: 'store2' }))
  })

  it('lets super admin change roles', async () => {
    await assertSucceeds(updateDoc(doc(as('admin'), 'users/other'), { role: 'driver' }))
  })
})

// ── Stores and products ─────────────────────────────────────────────────────

describe('stores', () => {
  it('shows approved stores to anyone, even logged out', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'stores/store1')))
  })

  it('hides pending stores from the public', async () => {
    await assertFails(getDoc(doc(anon(), 'stores/pendingStore')))
    await assertFails(getDoc(doc(as('customer'), 'stores/pendingStore')))
  })

  it('lets customers list approved stores in their suburb', async () => {
    const q = query(
      collection(as('customer'), 'stores'),
      where('approval', '==', 'approved'),
      where('deliverySuburbIds', 'array-contains', 'benoni-central'),
    )
    await assertSucceeds(getDocs(q))
  })

  it('lets a store admin register a store, as pending only', async () => {
    const db = as('storeAdmin')
    await assertSucceeds(setDoc(doc(db, 'stores/new'), baseStore({ id: 'new', approval: 'pending' })))
    await assertFails(setDoc(doc(db, 'stores/new2'), baseStore({ id: 'new2', approval: 'approved' })))
  })

  it('lets the owner pause their store but not approve it', async () => {
    const db = as('storeAdmin')
    await assertSucceeds(updateDoc(doc(db, 'stores/store1'), { tradingStatus: 'paused' }))
    await assertFails(updateDoc(doc(db, 'stores/store1'), { approval: 'suspended' }))
    await assertFails(updateDoc(doc(db, 'stores/store1'), { ownerUid: 'other' }))
  })

  it('blocks other store admins from touching it', async () => {
    await assertFails(updateDoc(doc(as('otherStoreAdmin'), 'stores/store1'), { tradingStatus: 'closed' }))
  })

  it('blocks customers from creating stores', async () => {
    await assertFails(setDoc(doc(as('customer'), 'stores/x'), baseStore({ id: 'x', ownerUid: 'customer', approval: 'pending' })))
  })
})

describe('products', () => {
  const product = (extra: Record<string, unknown> = {}) => ({
    id: 'p1',
    storeId: 'store1',
    vertical: 'essentials',
    categoryId: 'bread',
    name: 'Albany Brown Bread',
    nameLower: 'albany brown bread',
    keywords: ['albany', 'brown', 'bread'],
    description: '',
    basePriceCents: 2000,
    inStock: true,
    active: true,
    imageUrl: null,
    sort: 1,
    createdAt: now,
    updatedAt: now,
    ...extra,
  })

  it('lets the store admin add and edit products', async () => {
    const db = as('storeAdmin')
    await assertSucceeds(setDoc(doc(db, 'stores/store1/products/p1'), product()))
    await assertSucceeds(updateDoc(doc(db, 'stores/store1/products/p1'), { inStock: false }))
  })

  it('blocks zero or negative prices', async () => {
    await assertFails(setDoc(doc(as('storeAdmin'), 'stores/store1/products/p2'), product({ basePriceCents: 0 })))
    await assertFails(setDoc(doc(as('storeAdmin'), 'stores/store1/products/p2'), product({ basePriceCents: -100 })))
  })

  it('blocks a store admin adding products to another store', async () => {
    await assertFails(setDoc(doc(as('otherStoreAdmin'), 'stores/store1/products/p1'), product()))
  })

  it('shows active products to anyone, hides inactive ones', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'stores/store1/products/p1'), product())
      await setDoc(doc(db, 'stores/store1/products/hidden'), product({ id: 'hidden', active: false }))
    })
    await assertSucceeds(getDoc(doc(anon(), 'stores/store1/products/p1')))
    await assertFails(getDoc(doc(anon(), 'stores/store1/products/hidden')))
    await assertSucceeds(getDoc(doc(as('storeAdmin'), 'stores/store1/products/hidden')))
  })
})

// ── Orders ───────────────────────────────────────────────────────────────────

describe('placing an order', () => {
  const create = (db: Firestore, extra: Record<string, unknown> = {}) =>
    setDoc(doc(db, 'orders/order1'), {
      ...baseOrder(extra),
      timestamps: { ...emptyStamps, createdAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
    })

  it('lets a customer order from an open, approved store', async () => {
    await assertSucceeds(create(as('customer')))
  })

  it('blocks ordering for someone else', async () => {
    await assertFails(create(as('other')))
  })

  it('blocks drivers and store admins from placing orders', async () => {
    await assertFails(create(as('driver'), { customerUid: 'driver' }))
    await assertFails(create(as('storeAdmin'), { customerUid: 'storeAdmin' }))
  })

  it('blocks ordering from a closed or unapproved store', async () => {
    await seed(async (db) => updateDoc(doc(db, 'stores/store1'), { tradingStatus: 'closed' }))
    await assertFails(create(as('customer')))
    await assertFails(create(as('customer'), { storeId: 'pendingStore' }))
  })

  it('blocks skipping payment', async () => {
    await assertFails(create(as('customer'), { status: 'pending' }))
    await assertFails(create(as('customer'), { payment: { provider: 'demo', status: 'paid', reference: null } }))
  })

  it('blocks fiddled totals and fees', async () => {
    await assertFails(create(as('customer'), { pricing: { ...pricing, totalCents: 100 } }))
    await assertFails(create(as('customer'), { pricing: { ...pricing, serviceFeeCents: 0, totalCents: pricing.totalCents - 1500 } }))
  })

  it('blocks picking your own driver', async () => {
    await assertFails(create(as('customer'), { driverUid: 'driver' }))
  })
})

describe('order lifecycle', () => {
  const put = (extra: Record<string, unknown>) =>
    seed(async (db) => setDoc(doc(db, 'orders/order1'), baseOrder(extra)))

  const move = (db: Firestore, status: string, stampKey: string, extra: Record<string, unknown> = {}) =>
    updateDoc(doc(db, 'orders/order1'), {
      status,
      [`timestamps.${stampKey}`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...extra,
    })

  it('customer: demo payment moves it to pending', async () => {
    await put({})
    await assertSucceeds(
      move(as('customer'), 'pending', 'paidAt', { payment: { provider: 'demo', status: 'paid', reference: null } }),
    )
  })

  it('customer: can’t mark someone else’s order paid', async () => {
    await put({})
    await assertFails(
      move(as('other'), 'pending', 'paidAt', { payment: { provider: 'demo', status: 'paid', reference: null } }),
    )
  })

  it('customer: can cancel while pending, not once preparing', async () => {
    await put({ status: 'pending' })
    await assertSucceeds(move(as('customer'), 'cancelled', 'cancelledAt', { cancellation: { by: 'customer', reason: null } }))
    await put({ status: 'preparing' })
    await assertFails(move(as('customer'), 'cancelled', 'cancelledAt', { cancellation: { by: 'customer', reason: null } }))
  })

  it('store admin: accept, then mark ready', async () => {
    await put({ status: 'pending' })
    await assertSucceeds(move(as('storeAdmin'), 'preparing', 'acceptedAt'))
    await assertSucceeds(move(as('storeAdmin'), 'ready', 'readyAt'))
  })

  it('store admin: reject with a listed reason only', async () => {
    await put({ status: 'pending' })
    await assertFails(move(as('storeAdmin'), 'rejected', 'rejectedAt', { rejectReason: 'dont_feel_like_it' }))
    await assertSucceeds(move(as('storeAdmin'), 'rejected', 'rejectedAt', { rejectReason: 'out_of_stock' }))
  })

  it('store admin: can’t skip steps', async () => {
    await put({ status: 'pending' })
    await assertFails(move(as('storeAdmin'), 'ready', 'readyAt'))
    await put({ status: 'ready' })
    await assertFails(move(as('storeAdmin'), 'out_for_delivery', 'collectedAt'))
  })

  it('store admin: can’t touch another store’s orders', async () => {
    await put({ status: 'pending' })
    await assertFails(move(as('otherStoreAdmin'), 'preparing', 'acceptedAt'))
    await assertFails(getDoc(doc(as('otherStoreAdmin'), 'orders/order1')))
  })

  it('store admin: can’t change the money while updating status', async () => {
    await put({ status: 'pending' })
    await assertFails(move(as('storeAdmin'), 'preparing', 'acceptedAt', { 'pricing.storePayoutCents': 999999 }))
  })

  it('store admin: must use a server timestamp', async () => {
    await put({ status: 'pending' })
    await assertFails(
      updateDoc(doc(as('storeAdmin'), 'orders/order1'), {
        status: 'preparing',
        'timestamps.acceptedAt': Timestamp.fromDate(new Date('2020-01-01')),
      }),
    )
  })

  it('driver: only the assigned driver can collect and deliver', async () => {
    await put({ status: 'ready', driverUid: 'driver' })
    await assertFails(move(as('otherDriver'), 'out_for_delivery', 'collectedAt'))
    await assertSucceeds(move(as('driver'), 'out_for_delivery', 'collectedAt'))
    await assertSucceeds(move(as('driver'), 'delivered', 'deliveredAt'))
  })

  it('driver: can’t collect before it’s ready', async () => {
    await put({ status: 'preparing', driverUid: 'driver' })
    await assertFails(move(as('driver'), 'out_for_delivery', 'collectedAt'))
  })

  it('driver: can’t assign themselves', async () => {
    await put({ status: 'ready' })
    await assertFails(updateDoc(doc(as('driver'), 'orders/order1'), { driverUid: 'driver' }))
  })

  it('super admin: assigns drivers and cancels', async () => {
    await put({ status: 'preparing' })
    await assertSucceeds(updateDoc(doc(as('admin'), 'orders/order1'), { driverUid: 'driver', driverFirstName: 'driver' }))
    await assertSucceeds(move(as('admin'), 'cancelled', 'cancelledAt', { cancellation: { by: 'super_admin', reason: 'test' } }))
  })

  it('nobody deletes orders, not even super admin', async () => {
    await put({ status: 'delivered' })
    await assertFails(deleteDoc(doc(as('admin'), 'orders/order1')))
    await assertFails(deleteDoc(doc(as('customer'), 'orders/order1')))
  })

  it('order visibility: customer, store, assigned driver and admin only', async () => {
    await put({ status: 'ready', driverUid: 'driver' })
    await assertSucceeds(getDoc(doc(as('customer'), 'orders/order1')))
    await assertSucceeds(getDoc(doc(as('storeAdmin'), 'orders/order1')))
    await assertSucceeds(getDoc(doc(as('driver'), 'orders/order1')))
    await assertSucceeds(getDoc(doc(as('admin'), 'orders/order1')))
    await assertFails(getDoc(doc(as('other'), 'orders/order1')))
    await assertFails(getDoc(doc(as('otherDriver'), 'orders/order1')))
    await assertFails(getDoc(doc(anon(), 'orders/order1')))
  })

  it('store admin can list their live orders board', async () => {
    await put({ status: 'pending' })
    const q = query(collection(as('storeAdmin'), 'orders'), where('storeId', '==', 'store1'), where('status', '==', 'pending'))
    await assertSucceeds(getDocs(q))
    const all = query(collection(as('storeAdmin'), 'orders'))
    await assertFails(getDocs(all))
  })
})

// ── Drivers ──────────────────────────────────────────────────────────────────

describe('drivers', () => {
  const driverDoc = (extra: Record<string, unknown> = {}) => ({
    uid: 'driver',
    displayName: 'Driver Test',
    firstName: 'Driver',
    phone: '0820000000',
    verificationPath: 'sa_id',
    permitType: null,
    verification: { status: 'not_started', provider: null, reference: null, checkedAt: null },
    approval: 'applied',
    approvalNote: null,
    availability: 'offline',
    vehicle: { type: 'motorbike', registration: null },
    operatingSuburbIds: ['benoni-central'],
    activeOrderId: null,
    createdAt: now,
    updatedAt: now,
    ...extra,
  })

  it('lets a driver apply, but not pre-approved', async () => {
    await assertSucceeds(setDoc(doc(as('driver'), 'drivers/driver'), driverDoc()))
    await assertFails(setDoc(doc(as('otherDriver'), 'drivers/otherDriver'), driverDoc({ uid: 'otherDriver', approval: 'approved' })))
  })

  it('blocks a driver approving or verifying themselves', async () => {
    await seed(async (db) => setDoc(doc(db, 'drivers/driver'), driverDoc()))
    await assertFails(updateDoc(doc(as('driver'), 'drivers/driver'), { approval: 'approved' }))
    await assertFails(updateDoc(doc(as('driver'), 'drivers/driver'), { 'verification.status': 'passed' }))
  })

  it('approved driver: go online, but not edit anything else', async () => {
    await seed(async (db) => setDoc(doc(db, 'drivers/driver'), driverDoc({ approval: 'approved' })))
    await assertSucceeds(updateDoc(doc(as('driver'), 'drivers/driver'), { availability: 'available' }))
    await assertFails(updateDoc(doc(as('driver'), 'drivers/driver'), { 'vehicle.type': 'car' }))
  })

  it('approved driver: clears their finished order, can’t pick one', async () => {
    await seed(async (db) => setDoc(doc(db, 'drivers/driver'), driverDoc({ approval: 'approved', activeOrderId: 'order1' })))
    await assertSucceeds(updateDoc(doc(as('driver'), 'drivers/driver'), { activeOrderId: null, availability: 'available' }))
    await assertFails(updateDoc(doc(as('driver'), 'drivers/driver'), { activeOrderId: 'order9' }))
  })

  it('super admin approves drivers', async () => {
    await seed(async (db) => setDoc(doc(db, 'drivers/driver'), driverDoc()))
    await assertSucceeds(updateDoc(doc(as('admin'), 'drivers/driver'), { approval: 'approved' }))
  })
})

describe('config', () => {
  it('anyone reads pricing; only super admin changes it', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'config/pricing')))
    await assertFails(updateDoc(doc(as('storeAdmin'), 'config/pricing'), { markupBps: 0 }))
    await assertSucceeds(updateDoc(doc(as('admin'), 'config/pricing'), { markupBps: 1000 }))
  })
})
