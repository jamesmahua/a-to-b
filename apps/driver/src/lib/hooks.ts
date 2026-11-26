import { useEffect, useState } from 'react'
import { watchDriver, watchDriverOrders } from '@repo/firebase'
import type { Driver, Order } from '@repo/types'

const OFFLINE = 'We couldn’t load your jobs. Check your data or Wi-Fi.'

/** The driver's own doc, live. `undefined` while loading, `null` if they haven't applied. */
export function useMyDriver(uid: string): { driver: Driver | null | undefined; error: string | null } {
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  useEffect(
    () =>
      watchDriver(
        uid,
        (d) => {
          setDriver(d)
          setError(null)
        },
        () => setError(OFFLINE),
      ),
    [uid],
  )
  return { driver, error }
}

/**
 * Orders assigned to this driver (newest 20), live. One listener covers the
 * current job and recent ones, so a job that's cancelled or given to another
 * driver updates the screen by itself. Uses the existing (driverUid, createdAt) index.
 */
export function useMyOrders(uid: string): { orders: Order[] | null; error: string | null } {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(
    () =>
      watchDriverOrders(
        uid,
        (o) => {
          setOrders(o)
          setError(null)
        },
        () => setError(OFFLINE),
      ),
    [uid],
  )
  return { orders, error }
}
