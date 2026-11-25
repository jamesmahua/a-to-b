/**
 * @repo/firebase — the one way every K&K app talks to Firebase.
 * Works on Android, iOS and in the browser.
 */
export { getFirebase, getDb, getAuthInstance, PLATFORM } from './app'
export type { FirebaseServices } from './app'
export { readFirebaseSettings } from './config'
export type { FirebaseSettings } from './config'
export * from './refs'
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  sendPasswordReset,
  friendlyAuthError,
  AuthError,
} from './auth'
export type { SignUpInput, AuthErrorCode } from './auth'
export { AuthProvider, useAuth } from './AuthProvider'
export type { AccessStatus } from './AuthProvider'
export * from './orders'
export * from './drivers'
