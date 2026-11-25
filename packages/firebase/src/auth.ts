import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { CURRENT_TERMS_VERSION, type SelfSignupRole, type UserProfile } from '@repo/types'
import { getAuthInstance, PLATFORM } from './app'
import { userRef } from './refs'

export interface SignUpInput {
  email: string
  password: string
  displayName: string
  /** Which app they signed up in decides their role. Never super_admin. */
  role: SelfSignupRole
  phone?: string | null
  suburbId?: string | null
  /** They ticked "I accept the terms and privacy notice". Required (POPIA). */
  acceptedTerms: boolean
  marketingOptIn: boolean
}

const firstNameOf = (displayName: string) => displayName.trim().split(/\s+/)[0] ?? displayName.trim()

/** Writes users/{uid}. Timestamps come from the server, not the device clock. */
async function createProfile(user: User, input: Omit<SignUpInput, 'email' | 'password'>): Promise<void> {
  const displayName = input.displayName.trim() || 'K&K user'
  const profile = {
    role: input.role,
    displayName,
    firstName: firstNameOf(displayName),
    email: user.email,
    phone: input.phone ?? null,
    suburbId: input.suburbId ?? null,
    storeId: null,
    consent: {
      termsVersion: CURRENT_TERMS_VERSION,
      acceptedAt: serverTimestamp(),
      marketingOptIn: input.marketingOptIn,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  // `uid` is added by the converter from the doc id, and must also be stored for the rules.
  await setDoc(userRef(user.uid), { uid: user.uid, ...profile } as unknown as UserProfile)
}

export async function signUpWithEmail(input: SignUpInput): Promise<void> {
  if (!input.acceptedTerms) throw new AuthError('terms-required')
  const { user } = await createUserWithEmailAndPassword(getAuthInstance(), input.email.trim(), input.password)
  await updateProfile(user, { displayName: input.displayName.trim() })
  await createProfile(user, input)
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password)
}

/**
 * Google sign-in. Browser only in v1; on phones it needs a native Google module (later).
 * If it's their first time, a profile is created with the role of the app they're in.
 */
export async function signInWithGoogle(
  roleIfNew: SelfSignupRole,
  consent: { acceptedTerms: boolean; marketingOptIn: boolean },
): Promise<void> {
  if (PLATFORM !== 'web') throw new AuthError('google-web-only')
  const { user } = await signInWithPopup(getAuthInstance(), new GoogleAuthProvider())
  const existing = await getDoc(userRef(user.uid))
  if (!existing.exists()) {
    if (!consent.acceptedTerms) {
      await firebaseSignOut(getAuthInstance())
      throw new AuthError('terms-required')
    }
    await createProfile(user, {
      displayName: user.displayName ?? '',
      role: roleIfNew,
      acceptedTerms: true,
      marketingOptIn: consent.marketingOptIn,
    })
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getAuthInstance())
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuthInstance(), email.trim())
}

export type AuthErrorCode = 'terms-required' | 'google-web-only'

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code)
    this.name = 'AuthError'
  }
}

/**
 * Turns Firebase error codes into plain, friendly messages (spec §9.2).
 * Never shows raw codes to users.
 */
export function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'terms-required':
      return 'Please accept the terms and privacy notice to continue.'
    case 'google-web-only':
      return 'Google sign-in works in the browser for now. Please use your email and password.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'That email and password don’t match. Please try again.'
    case 'auth/email-already-in-use':
      return 'There’s already an account with that email. Try logging in instead.'
    case 'auth/weak-password':
      return 'Please use a password with at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many tries. Please wait a minute and try again.'
    case 'auth/network-request-failed':
      return 'No connection. Check your data or Wi-Fi and try again.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
