import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { storeRef, useAuth } from '@repo/firebase'
import type { Store } from '@repo/types'

export type MyStoreState =
  | { status: 'loading' }
  /** The account isn't linked to a store (users/{uid}.storeId is empty). */
  | { status: 'no_store' }
  | { status: 'error' }
  | { status: 'ready'; store: Store }

/**
 * The logged-in store admin's own store, live. If super admin approves it, or
 * (in step 4) the store switches to Paused, every screen updates by itself.
 */
export function useMyStore(): MyStoreState {
  const { profile } = useAuth()
  const hasProfile = profile !== null
  const storeId = profile?.storeId ?? null
  const [state, setState] = useState<MyStoreState>({ status: 'loading' })

  useEffect(() => {
    if (!hasProfile) return
    if (!storeId) {
      setState({ status: 'no_store' })
      return
    }
    setState({ status: 'loading' })
    return onSnapshot(
      storeRef(storeId),
      (snap) => setState(snap.exists() ? { status: 'ready', store: snap.data() } : { status: 'no_store' }),
      () => setState({ status: 'error' }),
    )
  }, [hasProfile, storeId])

  return state
}

/**
 * The current time, refreshed every `everyMs` (default 30 s), so "waiting 4 min"
 * keeps counting without anyone touching the screen.
 */
export function useNow(everyMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), everyMs)
    return () => clearInterval(timer)
  }, [everyMs])
  return now
}
