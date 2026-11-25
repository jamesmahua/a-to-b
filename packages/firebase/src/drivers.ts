/**
 * Reading drivers. Approving drivers (super admin step 2) will live here too.
 */
import { limit, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore'
import type { Driver } from '@repo/types'
import { driversCol } from './refs'

/**
 * Super admin: every approved driver, live, so the assign sheet shows who has
 * just gone online or finished a job. Single-field filter, so no extra index.
 */
export const watchApprovedDrivers = (
  onData: (drivers: Driver[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    query(driversCol(), where('approval', '==', 'approved'), limit(200)),
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  )
