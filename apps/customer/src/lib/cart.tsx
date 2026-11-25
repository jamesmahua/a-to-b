/**
 * The customer's cart.
 *
 * Kept on the device (AsyncStorage works on Android, iOS and in the browser),
 * so browsing and filling a cart costs no Firestore reads or writes. Nothing is
 * saved to Firestore until checkout turns the cart into orders.
 *
 * How it's built (a common React pattern worth knowing):
 *   1. A **reducer**: one pure function that takes the current cart and an
 *      action ("add 2 of X") and returns the new cart. Easy to test and reason about.
 *   2. A **context**: makes the cart available to every screen without passing
 *      props down through each component.
 *   3. A **hook** (`useCart()`): what screens actually call.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Product, Store } from '@repo/types'
import { EMPTY_CART, cartReducer, groupCart, sameLine, type CartGroup, type CartLine } from './cart-logic'

export { MAX_QUANTITY } from './cart-logic'
export type { CartGroup, CartLine, CartStoreInfo } from './cart-logic'

const STORAGE_KEY = 'kk.cart.v1'

// ── Context + hook ────────────────────────────────────────────────────────────

interface CartContextValue {
  loaded: boolean
  groups: CartGroup[]
  /** Total number of items (2 × bread + 1 × milk = 3). */
  itemCount: number
  quantityOf: (storeId: string, productId: string) => number
  setQuantity: (store: Pick<Store, 'id' | 'name' | 'vertical'>, product: Pick<Product, 'id' | 'name' | 'basePriceCents'>, quantity: number) => void
  updateLine: (storeId: string, productId: string, changes: Partial<Pick<CartLine, 'name' | 'basePriceCents' | 'quantity'>>) => void
  removeLine: (storeId: string, productId: string) => void
  removeStore: (storeId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, EMPTY_CART)

  // Load the saved cart once, when the app starts.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => dispatch({ type: 'loaded', saved: json ? JSON.parse(json) : null }))
      .catch(() => dispatch({ type: 'loaded', saved: null })) // corrupt or blocked storage: start empty
  }, [])

  // Save after every change (but not before loading, or we'd overwrite the saved cart with an empty one).
  useEffect(() => {
    if (!state.loaded) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: state.lines, stores: state.stores })).catch(() => {
      // Storage full or unavailable (e.g. private browsing). The cart still works for this visit.
    })
  }, [state])

  const quantityOf = useCallback(
    (storeId: string, productId: string) => state.lines.find((l) => sameLine(l, storeId, productId))?.quantity ?? 0,
    [state.lines],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      loaded: state.loaded,
      groups: groupCart(state.lines, state.stores),
      itemCount: state.lines.reduce((n, l) => n + l.quantity, 0),
      quantityOf,
      setQuantity: (store, product, quantity) =>
        dispatch({ type: 'setQuantity', store: { id: store.id, name: store.name, vertical: store.vertical }, product, quantity }),
      updateLine: (storeId, productId, changes) => dispatch({ type: 'updateLine', storeId, productId, changes }),
      removeLine: (storeId, productId) => dispatch({ type: 'removeLine', storeId, productId }),
      removeStore: (storeId) => dispatch({ type: 'removeStore', storeId }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [state, quantityOf],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
