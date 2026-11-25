/**
 * Checkout logic, kept out of the screen so it's easier to read and test.
 *
 * 1. `checkBasket()` re-reads every store and product in the cart. Prices and
 *    stock may have changed since things were added, and a store may have closed.
 * 2. `placeBasket()` turns each store's group into one order (sharing a
 *    `basketId`), then marks it paid with the demo payment.
 */
import { getDoc } from 'firebase/firestore'
import { newBasketId, payOrderDemo, placeOrder, productRef, storeRef } from '@repo/firebase'
import type { Address, Cents, Store, UserProfile } from '@repo/types'
import type { CartGroup } from './cart'
import { storeProblem } from './catalogue-logic'

export type LineFix =
  | { kind: 'remove'; storeId: string; productId: string; message: string }
  | { kind: 'price'; storeId: string; productId: string; basePriceCents: Cents; message: string }

export interface StoreCheck {
  store: Store | null
  /** Why this store's items can't be ordered right now, or null if they can. */
  problem: string | null
}

export interface BasketCheck {
  stores: Record<string, StoreCheck>
  fixes: LineFix[]
}

/** Reads a doc, treating "not allowed" (inactive product, unapproved store) the same as "gone". */
async function readOrNull<T>(read: () => Promise<{ exists(): boolean; data(): T | undefined }>): Promise<T | null> {
  try {
    const snap = await read()
    return snap.exists() ? (snap.data() ?? null) : null
  } catch (e) {
    if ((e as { code?: string }).code === 'permission-denied') return null
    throw e // offline etc.: let the screen show "try again"
  }
}

export async function checkBasket(groups: CartGroup[], suburb: { id: string; name: string }): Promise<BasketCheck> {
  const stores: Record<string, StoreCheck> = {}
  const fixes: LineFix[] = []

  // All reads at once (Promise.all), not one after another: much faster on a slow connection.
  await Promise.all(
    groups.map(async (group) => {
      const store = await readOrNull(() => getDoc(storeRef(group.store.id)))
      stores[group.store.id] = { store, problem: storeProblem(store, group.store.name, suburb) }

      await Promise.all(
        group.lines.map(async (line) => {
          const product = await readOrNull(() => getDoc(productRef(line.storeId, line.productId)))
          const ids = { storeId: line.storeId, productId: line.productId }
          if (!product || !product.active) {
            fixes.push({ kind: 'remove', ...ids, message: `${line.name} is no longer sold, so we took it out.` })
          } else if (!product.inStock) {
            fixes.push({ kind: 'remove', ...ids, message: `${line.name} is sold out, so we took it out.` })
          } else if (product.basePriceCents !== line.basePriceCents) {
            fixes.push({
              kind: 'price',
              ...ids,
              basePriceCents: product.basePriceCents,
              message: `The price of ${line.name} has changed. Your totals are updated.`,
            })
          }
        }),
      )
    }),
  )
  return { stores, fixes }
}

export interface PlaceBasketInput {
  groups: CartGroup[]
  stores: Record<string, StoreCheck>
  customer: Pick<UserProfile, 'uid' | 'firstName'>
  deliveryAddress: Address
  deliveryInstructions: string | null
}

export interface PlaceResult {
  storeId: string
  storeName: string
  orderId: string | null
  error: string | null
}

/**
 * One order per store, all sharing one basketId. If one store fails, the others
 * still go through, and the failed store's items stay in the cart.
 *
 * DEMO: priced and "paid" on the device (spec §10.4 known limits). Before real
 * money, this moves to a Cloud Function and Peach Payments.
 */
export async function placeBasket(input: PlaceBasketInput): Promise<{ basketId: string; results: PlaceResult[] }> {
  const basketId = newBasketId()
  const results: PlaceResult[] = []

  // One store at a time, so a failure part-way is easy to report.
  for (const group of input.groups) {
    const check = input.stores[group.store.id]
    if (!check?.store || check.problem) continue
    const store = check.store
    try {
      const orderId = await placeOrder({
        customer: input.customer,
        store,
        lines: group.lines.map((l) => ({
          product: { id: l.productId, name: l.name, basePriceCents: l.basePriceCents, storeId: l.storeId },
          quantity: l.quantity,
        })),
        deliveryAddress: input.deliveryAddress,
        deliveryInstructions: input.deliveryInstructions,
        basketId,
      })
      await payOrderDemo({ id: orderId, status: 'awaiting_payment' })
      results.push({ storeId: store.id, storeName: store.name, orderId, error: null })
    } catch {
      results.push({
        storeId: store.id,
        storeName: store.name,
        orderId: null,
        error: `We couldn’t place your order with ${store.name}. Its items are still in your cart.`,
      })
    }
  }
  return { basketId, results }
}
