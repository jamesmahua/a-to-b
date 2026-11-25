import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { readFirebaseSettings } from './config'
import { createAuth, createFirestore, PLATFORM } from './platform'

export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

let services: FirebaseServices | null = null

/**
 * The one Firebase connection for the app. Created on first use, then reused
 * (also survives hot reload in development).
 */
export function getFirebase(): FirebaseServices {
  if (services) return services

  const settings = readFirebaseSettings()
  // The emulators always use the offline 'demo-kk' project, so local testing never touches real data.
  const projectId = settings.useEmulators ? 'demo-kk' : settings.projectId
  const alreadyStarted = getApps().length > 0
  const app = alreadyStarted
    ? getApp()
    : initializeApp({
        apiKey: settings.apiKey || 'demo-key',
        authDomain: settings.authDomain,
        projectId,
        storageBucket: settings.storageBucket,
        messagingSenderId: settings.messagingSenderId,
        appId: settings.appId,
      })

  // After a hot reload the app already exists, and Auth/Firestore can't be initialised twice.
  const auth = alreadyStarted ? getAuth(app) : createAuth(app)
  const db = alreadyStarted ? getFirestore(app) : createFirestore(app)

  if (settings.useEmulators && !alreadyStarted) {
    connectAuthEmulator(auth, `http://${settings.emulatorHost}:9099`, { disableWarnings: true })
    connectFirestoreEmulator(db, settings.emulatorHost, 8080)
  }

  services = { app, auth, db }
  return services
}

export const getDb = (): Firestore => getFirebase().db
export const getAuthInstance = (): Auth => getFirebase().auth

export { PLATFORM }
