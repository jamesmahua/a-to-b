/**
 * Fills Firestore + Auth with demo data: four accounts (one per role), two stores,
 * ~37 products, suburbs, pricing, and orders in every status for the store board.
 *
 *   Local emulators (safe, free):   npm run emulators      (one terminal)
 *                                   npm run seed:emulator  (another terminal)
 *
 *   Real project (a-two-b):         npm run seed -- --real
 *     Needs a service-account key: Firebase console → Project settings → Service accounts
 *     → Generate new private key. Save it OUTSIDE the repo and set
 *     GOOGLE_APPLICATION_CREDENTIALS to its path. Never commit it.
 *
 * Safe to run again: it updates the same demo docs rather than duplicating them.
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'
import {
  DEFAULT_PRICING,
  buildKeywords,
  calculateOrderPricing,
  getCustomerUnitPrice,
  CURRENT_TERMS_VERSION,
  type OrderStatus,
  type Role,
} from '@repo/types'
import { DEMO_PASSWORD, KOTA, SPAZA, SUBURBS, cats, slug, type SeedStore } from './data'

const real = process.argv.includes('--real')
const projectId = real ? (process.env.FIREBASE_PROJECT_ID ?? 'a-two-b') : 'demo-kk'

if (!real) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
} else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('✖ Set GOOGLE_APPLICATION_CREDENTIALS to your service-account key file first (see the top of this file).')
  process.exit(1)
}

initializeApp(real ? { projectId, credential: applicationDefault() } : { projectId })
const db: Firestore = getFirestore()
const auth = getAuth()
const now = Timestamp.now()
const minutesAgo = (m: number) => Timestamp.fromMillis(Date.now() - m * 60_000)
const suburbName = (id: string) => SUBURBS.find((s) => slug(s.name) === id)?.name ?? id

// ── Accounts ──────────────────────────────────────────────────────────────────

interface Account {
  key: string
  role: Role
  email: string
  displayName: string
  phone: string
  suburb: string
  storeId: string | null
}

const ACCOUNTS: Account[] = [
  { key: 'customer', role: 'customer', email: 'customer@demo.kandk.co.za', displayName: 'Demo Customer', phone: '0820000001', suburb: 'Northmead', storeId: null },
  { key: 'storeAdmin', role: 'store_admin', email: 'store@demo.kandk.co.za', displayName: 'Demo StoreAdmin', phone: '0820000002', suburb: 'Benoni Central', storeId: SPAZA.id },
  { key: 'kotaAdmin', role: 'store_admin', email: 'kota@demo.kandk.co.za', displayName: 'Demo KotaAdmin', phone: '0820000005', suburb: 'Wattville', storeId: KOTA.id },
  { key: 'driver', role: 'driver', email: 'driver@demo.kandk.co.za', displayName: 'Demo Driver', phone: '0820000003', suburb: 'Benoni Central', storeId: null },
  {
    key: 'superAdmin',
    role: 'super_admin',
    email: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@demo.kandk.co.za',
    displayName: 'Super Admin',
    phone: '0820000004',
    suburb: 'Benoni Central',
    storeId: null,
  },
]

async function upsertAccount(a: Account): Promise<string> {
  let uid: string
  try {
    uid = (await auth.getUserByEmail(a.email)).uid
  } catch {
    uid = (await auth.createUser({ email: a.email, password: DEMO_PASSWORD, displayName: a.displayName, emailVerified: true })).uid
  }
  await db.doc(`users/${uid}`).set({
    uid,
    role: a.role,
    displayName: a.displayName,
    firstName: a.displayName.split(' ')[0],
    email: a.email,
    phone: a.phone,
    suburbId: slug(a.suburb),
    storeId: a.storeId,
    consent: { termsVersion: CURRENT_TERMS_VERSION, acceptedAt: now, marketingOptIn: false },
    createdAt: now,
    updatedAt: now,
  })
  return uid
}

// ── Stores and products ───────────────────────────────────────────────────────

async function seedStore(s: SeedStore, ownerUid: string) {
  const categories = cats(s.categories)
  await db.doc(`stores/${s.id}`).set({
    name: s.name,
    nameLower: s.name.toLowerCase(),
    vertical: s.vertical,
    description: s.description,
    ownerUid,
    phone: s.phone,
    address: { line1: s.line1, line2: null, suburbId: slug(s.suburb), suburbName: s.suburb },
    deliverySuburbIds: s.deliversTo.map(slug),
    approval: 'approved',
    tradingStatus: 'open',
    hours: s.hours,
    categories,
    imageUrl: null,
    createdAt: now,
    updatedAt: now,
  })
  const batch = db.batch()
  s.products.forEach((p, i) => {
    const id = slug(p.name)
    batch.set(db.doc(`stores/${s.id}/products/${id}`), {
      storeId: s.id,
      vertical: s.vertical,
      categoryId: slug(p.category),
      name: p.name,
      nameLower: p.name.toLowerCase(),
      keywords: buildKeywords(p.name, p.category, p.tags ?? ''),
      description: '',
      basePriceCents: Math.round(p.price * 100),
      inStock: p.inStock ?? true,
      active: true,
      imageUrl: null,
      sort: i + 1,
      createdAt: now,
      updatedAt: now,
    })
  })
  await batch.commit()
}

// ── Orders: one in every status, for the store admin board ────────────────────

async function seedOrders(customerUid: string, driverUid: string) {
  const store = SPAZA
  const pick = (names: [string, number][]) =>
    names.map(([name, quantity]) => {
      const p = store.products.find((x) => x.name.startsWith(name))
      if (!p) throw new Error(`No product starting "${name}"`)
      return { p, quantity }
    })

  const scenarios: { id: string; code: string; status: OrderStatus; ageMin: number; items: [string, number][]; driver?: boolean; note?: string }[] = [
    { id: 'demo-order-1', code: 'KK-4821', status: 'pending', ageMin: 2, items: [['Albany', 2], ['Clover Full Cream', 1], ['Large Eggs', 1]], note: 'Please check the eggs aren’t cracked' },
    { id: 'demo-order-2', code: 'KK-4822', status: 'pending', ageMin: 6, items: [['Coca-Cola', 1], ['Simba', 2]] },
    { id: 'demo-order-3', code: 'KK-4817', status: 'preparing', ageMin: 14, items: [['Iwisa', 1], ['Lucky Star', 2], ['Sunfoil', 1]] },
    { id: 'demo-order-4', code: 'KK-4810', status: 'ready', ageMin: 25, items: [['Joko', 1], ['Selati', 1]], driver: true },
    { id: 'demo-order-5', code: 'KK-4802', status: 'out_for_delivery', ageMin: 40, items: [['Household Candles', 2], ['Twinsaver', 1]], driver: true },
    { id: 'demo-order-6', code: 'KK-4790', status: 'delivered', ageMin: 180, items: [['Sasko', 1], ['Rama', 1], ['Clover Amasi', 1]], driver: true },
    { id: 'demo-order-7', code: 'KK-4788', status: 'rejected', ageMin: 240, items: [['Lion Matches', 3]] },
    { id: 'demo-order-8', code: 'KK-4785', status: 'cancelled', ageMin: 300, items: [['Bar One', 4]] },
  ]

  const order: OrderStatus[] = ['awaiting_payment', 'pending', 'preparing', 'ready', 'out_for_delivery', 'delivered']
  const reached = (s: OrderStatus, step: OrderStatus) => order.indexOf(s) >= order.indexOf(step)

  const address = { line1: '22 Pretoria Rd', line2: null, suburbId: 'northmead', suburbName: suburbName('northmead') }
  const storeAddress = { line1: store.line1, line2: null, suburbId: slug(store.suburb), suburbName: store.suburb }

  for (const [i, sc] of scenarios.entries()) {
    const lines = pick(sc.items)
    const pricing = calculateOrderPricing(
      lines.map(({ p, quantity }) => ({ basePriceCents: Math.round(p.price * 100), quantity })),
      DEFAULT_PRICING,
    )
    const t = (offset: number) => minutesAgo(Math.max(sc.ageMin - offset, 0))
    const paid = sc.status !== 'awaiting_payment'
    await db.doc(`orders/${sc.id}`).set({
      code: sc.code,
      basketId: `demo-basket-${i + 1}`,
      customerUid,
      customerFirstName: 'Demo',
      storeId: store.id,
      storeName: store.name,
      storeVertical: store.vertical,
      storeAddress,
      items: lines.map(({ p, quantity }) => {
        const base = Math.round(p.price * 100)
        const unit = getCustomerUnitPrice(base, DEFAULT_PRICING)
        return { productId: slug(p.name), name: p.name, quantity, unitBasePriceCents: base, unitPriceCents: unit, lineTotalCents: unit * quantity }
      }),
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      pricing,
      deliveryAddress: address,
      deliveryInstructions: 'Blue gate, ring twice',
      customerNote: sc.note ?? null,
      status: sc.status,
      driverUid: sc.driver ? driverUid : null,
      driverFirstName: sc.driver ? 'Demo' : null,
      collectionCode: String(1000 + i * 1111).slice(-4),
      payment: { provider: 'demo', status: paid ? 'paid' : 'unpaid', reference: paid ? `DEMO-${sc.id}` : null },
      rejectReason: sc.status === 'rejected' ? 'out_of_stock' : null,
      cancellation: sc.status === 'cancelled' ? { by: 'customer', reason: 'Ordered by mistake' } : null,
      timestamps: {
        createdAt: t(0),
        paidAt: paid ? t(0) : null,
        acceptedAt: reached(sc.status, 'preparing') ? t(3) : null,
        readyAt: reached(sc.status, 'ready') ? t(12) : null,
        collectedAt: reached(sc.status, 'out_for_delivery') ? t(18) : null,
        deliveredAt: sc.status === 'delivered' ? t(35) : null,
        rejectedAt: sc.status === 'rejected' ? t(2) : null,
        cancelledAt: sc.status === 'cancelled' ? t(1) : null,
      },
      updatedAt: now,
    })
  }
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding ${real ? `REAL project "${projectId}"` : 'local emulators (demo-kk)'}…`)

  await db.doc('config/pricing').set({ ...DEFAULT_PRICING, updatedAt: now })
  const sb = db.batch()
  for (const s of SUBURBS) sb.set(db.doc(`suburbs/${slug(s.name)}`), s)
  await sb.commit()
  console.log(`✔ pricing + ${SUBURBS.length} suburbs`)

  const uids: Record<string, string> = {}
  for (const a of ACCOUNTS) uids[a.key] = await upsertAccount(a)
  console.log(`✔ ${ACCOUNTS.length} accounts`)

  await seedStore(SPAZA, uids.storeAdmin!)
  await seedStore(KOTA, uids.kotaAdmin!)
  console.log(`✔ 2 stores, ${SPAZA.products.length + KOTA.products.length} products`)

  await db.doc(`drivers/${uids.driver}`).set({
    uid: uids.driver,
    displayName: 'Demo Driver',
    firstName: 'Demo',
    phone: '0820000003',
    verificationPath: 'sa_id',
    permitType: null,
    verification: { status: 'passed', provider: 'demo', reference: 'DEMO-VERIFY', checkedAt: now },
    approval: 'approved',
    approvalNote: null,
    availability: 'on_delivery',
    vehicle: { type: 'motorbike', registration: 'ND 123-456 GP' },
    operatingSuburbIds: SPAZA.deliversTo.map(slug),
    activeOrderId: 'demo-order-5',
    createdAt: now,
    updatedAt: now,
  })
  console.log('✔ approved driver')

  await seedOrders(uids.customer!, uids.driver!)
  console.log('✔ 8 orders (one in every status)')

  console.log('\nDemo logins (password for all: ' + DEMO_PASSWORD + ')')
  for (const a of ACCOUNTS) console.log(`  ${a.role.padEnd(12)} ${a.email}`)
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error('✖ Seed failed:', err)
    process.exit(1)
  },
)
