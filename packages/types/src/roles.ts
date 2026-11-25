/**
 * User roles. One role per account in v1.
 * (Someone who is both a driver and a customer uses two accounts for now.)
 */
export const ROLES = ['customer', 'store_admin', 'driver', 'super_admin'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Customer',
  store_admin: 'Store admin',
  driver: 'Driver',
  super_admin: 'Super admin',
}

/** Roles a person can give themselves at sign-up. `super_admin` is only ever set by the seed script or another super admin. */
export const SELF_SIGNUP_ROLES = ['customer', 'store_admin', 'driver'] as const satisfies readonly Role[]
export type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number]

/**
 * Which app each role uses, and where that app lives in the browser.
 * www.kandk.co.za/shop, /store, /driver, /admin
 */
export const ROLE_APPS: Record<Role, { appName: string; webPath: string }> = {
  customer: { appName: 'Klick&Kolleka', webPath: '/shop' },
  store_admin: { appName: 'K&K Store', webPath: '/store' },
  driver: { appName: 'K&K Driver', webPath: '/driver' },
  super_admin: { appName: 'K&K Admin', webPath: '/admin' },
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}
