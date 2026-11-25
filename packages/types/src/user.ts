import type { TimestampLike } from './common'
import type { Role } from './roles'

/**
 * users/{uid}
 * One document per Firebase Auth account. The `role` decides which app they can use.
 * Security rules stop people changing their own role.
 */
export interface UserProfile {
  uid: string
  role: Role
  displayName: string
  /** First name only: what stores and drivers see on an order. */
  firstName: string
  email: string | null
  phone: string | null
  /** Customer's home suburb, used to list stores that deliver there. */
  suburbId: string | null
  /** Set for store admins only: the store they manage. */
  storeId: string | null
  consent: UserConsent
  createdAt: TimestampLike
  updatedAt: TimestampLike
}

/** POPIA / ECTA: what the person agreed to at sign-up. */
export interface UserConsent {
  /** Version of the terms + privacy notice they accepted, e.g. "2026-11". */
  termsVersion: string
  acceptedAt: TimestampLike
  /** Promotional messages. Off unless they opt in (CPA opt-out rules). */
  marketingOptIn: boolean
}

/**
 * users/{uid}/devices/{deviceId}
 * One per phone or browser, so notifications reach every device someone uses.
 * WhatsApp (v2) plugs in here as another channel.
 */
export type DevicePlatform = 'web' | 'android' | 'ios'

export interface UserDevice {
  id: string
  platform: DevicePlatform
  /** Web push (FCM) token or Expo push token. Null until the person allows notifications. */
  pushToken: string | null
  /** Which app this device is signed in to, e.g. "store_admin". */
  appRole: Role
  lastSeenAt: TimestampLike
}

/** The version of terms shown at sign-up. Bump when the terms change. */
export const CURRENT_TERMS_VERSION = '2026-11'
