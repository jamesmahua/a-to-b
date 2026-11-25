/**
 * The cart's rules, as pure functions: no React, no storage, no Firestore.
 * That's what makes them easy to unit test (see cart-logic.test.ts).
 * `cart.tsx` wires them up to React and the device's storage.
 */
import type { Cents, Product, Vertical } from '@repo/types'

// ── Shapes ────────────────────────────────────────────────────────────────────

/** One product in the cart. Only what checkout needs, copied from the product. */
export interface CartLine {
  storeId: string
  productId: string
  name: string
  /** The store's price when it was added. Checkout re-reads the product to catch price changes. */
  basePriceCents: Cents
  quantity: number
}

/** Enough about a store to show its group in the cart without reading Firestore. */
export interface CartStoreInfo {
  id: string
  name: string
  vertical: Vertical
}

/** The cart grouped by store. Each group becomes one order at checkout (one order = one store). */
export interface CartGroup {
  store: CartStoreInfo
  lines: CartLine[]
  itemCount: number
}

export interface CartState {
  lines: CartLine[]
  stores: Record<string, CartStoreInfo>
  /** False until the saved cart has been loaded from the device. */
  loaded: boolean
}

export type CartAction =
  | { type: 'loaded'; saved: Pick<CartState, 'lines' | 'stores'> | null }
  | { type: 'setQuantity'; store: CartStoreInfo; product: Pick<Product, 'id' | 'name' | 'basePriceCents'>; quantity: number }
  | { type: 'updateLine'; storeId: string; productId: string; changes: Partial<Pick<CartLine, 'name' | 'basePriceCents' | 'quantity'>> }
  | { type: 'removeLine'; storeId: string; productId: string }
  | { type: 'removeStore'; storeId: string }
  | { type: 'clear' }

/** Max of one product in a single order. Keeps orders sensible (and under the rules' 50-line limit per order). */
export const MAX_QUANTITY = 20

export const EMPTY_CART: CartState = { lines: [], stores: {}, loaded: false }

// ── The reducer (pure: no saving, no Firestore) ───────────────────────────────

export const sameLine = (l: CartLine, storeId: string, productId: string) => l.storeId === storeId && l.productId === productId

/** Drops store info for stores that no longer have anything in the cart. */
function tidy(state: CartState): CartState {
  const used = new Set(state.lines.map((l) => l.storeId))
  const stores = Object.fromEntries(Object.entries(state.stores).filter(([id]) => used.has(id)))
  return { ...state, stores }
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'loaded':
      return { lines: action.saved?.lines ?? [], stores: action.saved?.stores ?? {}, loaded: true }

    case 'setQuantity': {
      const { store, product } = action
      const quantity = Math.max(0, Math.min(MAX_QUANTITY, Math.round(action.quantity)))
      const exists = state.lines.some((l) => sameLine(l, store.id, product.id))
      let lines: CartLine[]
      if (quantity === 0) {
        lines = state.lines.filter((l) => !sameLine(l, store.id, product.id))
      } else if (exists) {
        lines = state.lines.map((l) => (sameLine(l, store.id, product.id) ? { ...l, quantity } : l))
      } else {
        lines = [
          ...state.lines,
          { storeId: store.id, productId: product.id, name: product.name, basePriceCents: product.basePriceCents, quantity },
        ]
      }
      return tidy({ ...state, lines, stores: { ...state.stores, [store.id]: store } })
    }

    case 'updateLine':
      return {
        ...state,
        lines: state.lines.map((l) => (sameLine(l, action.storeId, action.productId) ? { ...l, ...action.changes } : l)),
      }

    case 'removeLine':
      return tidy({ ...state, lines: state.lines.filter((l) => !sameLine(l, action.storeId, action.productId)) })

    case 'removeStore':
      return tidy({ ...state, lines: state.lines.filter((l) => l.storeId !== action.storeId) })

    case 'clear':
      return { ...state, lines: [], stores: {} }
  }
}

/** Groups lines by store, in the order the stores were first added. */
export function groupCart(lines: CartLine[], stores: Record<string, CartStoreInfo>): CartGroup[] {
  const groups: CartGroup[] = []
  for (const line of lines) {
    let group = groups.find((g) => g.store.id === line.storeId)
    if (!group) {
      const store = stores[line.storeId] ?? { id: line.storeId, name: 'Store', vertical: 'retail' as const }
      group = { store, lines: [], itemCount: 0 }
      groups.push(group)
    }
    group.lines.push(line)
    group.itemCount += line.quantity
  }
  return groups
}

