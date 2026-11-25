/**
 * Reading stores and products from Firestore.
 *
 * Two kinds of read are used on purpose:
 *  - **Live** (`onSnapshot`) for stores, so "Open / Paused / Closed" updates on
 *    screen the moment the store flips its switch.
 *  - **Once** (`getDocs`) for products and search. Product lists change rarely,
 *    and a one-off read costs less data and fewer Firestore reads (spec §9.2).
 */
import { useEffect, useState } from 'react'
import { getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { allProducts, productsCol, storeRef, storesCol } from '@repo/firebase'
import type { Product, Store } from '@repo/types'
import { matchesSearch, searchWords, sortProducts } from './catalogue-logic'

export { matchesSearch, searchWords, sortProducts } from './catalogue-logic'

export interface Loadable<T> {
  data: T
  loading: boolean
  error: string | null
}

const OFFLINE_MESSAGE = 'We couldn’t load this. Check your connection and try again.'

/** Approved stores that deliver to the suburb, A–Z. Live. */
export function useStoresForSuburb(suburbId: string | null): Loadable<Store[]> {
  const [state, setState] = useState<Loadable<Store[]>>({ data: [], loading: !!suburbId, error: null })

  useEffect(() => {
    if (!suburbId) {
      setState({ data: [], loading: false, error: null })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    // Uses the composite index approval + deliverySuburbIds + nameLower (firestore.indexes.json).
    const q = query(
      storesCol(),
      where('approval', '==', 'approved'),
      where('deliverySuburbIds', 'array-contains', suburbId),
      orderBy('nameLower'),
      limit(100),
    )
    // onSnapshot returns an "unsubscribe" function. Returning it from useEffect
    // stops listening when the screen closes or the suburb changes.
    return onSnapshot(
      q,
      (snap) => setState({ data: snap.docs.map((d) => d.data()), loading: false, error: null }),
      () => setState({ data: [], loading: false, error: OFFLINE_MESSAGE }),
    )
  }, [suburbId])

  return state
}

/** One store, live. `data` is null if it doesn't exist or isn't approved (the rules hide it). */
export function useStore(storeId: string | undefined): Loadable<Store | null> {
  const [state, setState] = useState<Loadable<Store | null>>({ data: null, loading: true, error: null })

  useEffect(() => {
    if (!storeId) return
    return onSnapshot(
      storeRef(storeId),
      (snap) => setState({ data: snap.exists() ? snap.data() : null, loading: false, error: null }),
      // permission-denied = not approved; show it the same as "not found".
      (err) => setState({ data: null, loading: false, error: err.code === 'permission-denied' ? null : OFFLINE_MESSAGE }),
    )
  }, [storeId])

  return state
}

/**
 * All active products in one store, read once.
 *
 * Why no `orderBy` in the query? `where('active') + orderBy('sort')` would need a
 * new composite index. A store has tens of products, not thousands, so sorting
 * them on the phone is cheaper and simpler.
 */
export function useStoreProducts(store: Store | null): Loadable<Product[]> & { reload: () => void } {
  const [state, setState] = useState<Loadable<Product[]>>({ data: [], loading: true, error: null })
  const [attempt, setAttempt] = useState(0)
  const storeId = store?.id

  useEffect(() => {
    if (!store) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    // `active == true` is required: the rules only let customers read active products,
    // and Firestore rejects a query that *could* return documents you can't read.
    getDocs(query(productsCol(store.id), where('active', '==', true), limit(500)))
      .then((snap) => {
        if (cancelled) return
        setState({ data: sortProducts(snap.docs.map((d) => d.data()), store), loading: false, error: null })
      })
      .catch(() => !cancelled && setState({ data: [], loading: false, error: OFFLINE_MESSAGE }))
    return () => {
      cancelled = true
    }
    // Re-read when the store id changes or on "Try again", not on every live store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, attempt])

  return { ...state, reload: () => setAttempt((n) => n + 1) }
}

// ── Search ────────────────────────────────────────────────────────────────────

/**
 * Product search across every store, in two small queries:
 *   1. `keywords array-contains <a whole word>` finds the word anywhere in the
 *      name or tags ("bread" → "Albany Superior White Bread").
 *   2. `nameLower` starts with what was typed, for half-typed words ("brea…").
 * The results are merged, then filtered on the phone so every word matches.
 *
 * Firestore has no full-text search. That's fine for a demo; Typesense or
 * Algolia can replace this later without changing the screens (spec §10.4).
 */
export async function searchProducts(text: string, max = 20): Promise<Product[]> {
  const words = searchWords(text)
  if (words.length === 0) return []
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a))
  const typed = text.trim().toLowerCase()

  const byKeyword = query(
    allProducts(),
    where('active', '==', true),
    where('keywords', 'array-contains', longest),
    orderBy('nameLower'),
    limit(max),
  )
  // Needs the collection-group index active + nameLower (added to firestore.indexes.json).
  const byPrefix = query(
    allProducts(),
    where('active', '==', true),
    orderBy('nameLower'),
    where('nameLower', '>=', typed),
    where('nameLower', '<', typed + ''), // '' sorts after every normal character
    limit(max),
  )

  const [a, b] = await Promise.all([getDocs(byKeyword), getDocs(byPrefix)])
  const seen = new Map<string, Product>()
  for (const d of [...a.docs, ...b.docs]) {
    const p = d.data()
    seen.set(`${p.storeId}/${p.id}`, p)
  }
  return [...seen.values()].filter((p) => matchesSearch(p, words)).sort((x, y) => x.nameLower.localeCompare(y.nameLower))
}
