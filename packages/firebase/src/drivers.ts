/**
 * Reading and updating drivers. Approving drivers (super admin step 2) will live here too.
 */
import { limit, onSnapshot, query, serverTimestamp, updateDoc, where, type Unsubscribe } from 'firebase/firestore'
import type { Driver } from '@repo/types'
import { driverRef, driversCol } from './refs'

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

/**
 * Driver app: the driver's own doc, live, so approval, online/offline and a newly
 * assigned job show up without a refresh. `null` = no application yet.
 */
export const watchDriver = (
  uid: string,
  onData: (driver: Driver | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe =>
  onSnapshot(
    driverRef(uid),
    (snap) => onData(snap.exists() ? snap.data() : null),
    (err) => onError?.(err),
  )

/**
 * Go online (dispatch can pick you) or offline. Approved drivers only (rules).
 * The driver app doesn't offer "offline" during a job: dispatch counts a driver
 * on a job as busy either way, and the job still has to be finished.
 */
export const setDriverOnline = (uid: string, online: boolean): Promise<void> =>
  updateDoc(driverRef(uid), { availability: online ? 'available' : 'offline', updatedAt: serverTimestamp() })

/**
 * Clears a job that ended without the driver finishing it (the customer, store or
 * admin cancelled it before pickup), so the driver's doc stops pointing at it.
 * Dispatch already treats them as free (decision #29); this tidies the doc.
 */
export const clearFinishedJob = (uid: string): Promise<void> =>
  updateDoc(driverRef(uid), { activeOrderId: null, availability: 'available', updatedAt: serverTimestamp() })
