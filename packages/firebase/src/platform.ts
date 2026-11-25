/**
 * Browser version. The phone version is platform.native.ts:
 * Metro (Expo) picks `.native.ts` on Android/iOS and this file on web.
 */
import type { FirebaseApp } from 'firebase/app'
import { browserLocalPersistence, initializeAuth, browserPopupRedirectResolver, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

export const PLATFORM = 'web' as const

export function createAuth(app: FirebaseApp): Auth {
  // Stays logged in across visits; shared by /shop, /store, /driver and /admin (same domain).
  return initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  })
}

export function createFirestore(app: FirebaseApp): Firestore {
  // Offline cache in the browser: pages open without signal and writes queue until it's back (spec §9.2).
  return initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
}
