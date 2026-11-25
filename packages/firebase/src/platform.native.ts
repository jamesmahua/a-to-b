/**
 * Phone version (Android/iOS). The browser version is platform.ts.
 */
import { Platform } from 'react-native'
import type { FirebaseApp } from 'firebase/app'
import * as FirebaseAuth from 'firebase/auth'
import { initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const PLATFORM = Platform.OS === 'ios' ? ('ios' as const) : ('android' as const)

// Exported by Firebase's React Native build only, so it's missing from the browser type definitions.
const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence
  }
).getReactNativePersistence

export function createAuth(app: FirebaseApp): FirebaseAuth.Auth {
  // Stays logged in after the app is closed.
  return FirebaseAuth.initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
}

export function createFirestore(app: FirebaseApp): Firestore {
  // React Native has no IndexedDB, so the cache lives in memory while the app is open.
  // Writes made without signal still queue and send when it returns.
  // Long polling is more reliable than WebChannel on React Native.
  return initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true,
  })
}
