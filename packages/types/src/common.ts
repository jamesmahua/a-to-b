/**
 * Shared primitives used across the data model.
 */

/** Money is always stored as whole cents (R12.90 = 1290). Never use floats for money. */
export type Cents = number

/**
 * Structural stand-in for a Firestore Timestamp.
 * Matches both the client SDK (`firebase/firestore`) and the Admin SDK,
 * so this package doesn't depend on either.
 */
export interface TimestampLike {
  seconds: number
  nanoseconds: number
  toDate(): Date
}

/** The five things K&K sells. Each has its own accent colour in the design system. */
export const VERTICALS = ['food', 'retail', 'essentials', 'parcels', 'services'] as const
export type Vertical = (typeof VERTICALS)[number]

export const VERTICAL_LABELS: Record<Vertical, string> = {
  food: 'Food',
  retail: 'Retail',
  essentials: 'Essentials',
  parcels: 'Parcels',
  services: 'Services',
}

/** Firestore collection names, in one place so nobody typos them. */
export const COLLECTIONS = {
  users: 'users',
  devices: 'devices', // subcollection of users
  stores: 'stores',
  products: 'products', // subcollection of stores
  orders: 'orders',
  drivers: 'drivers',
  suburbs: 'suburbs',
  config: 'config',
} as const

/** Document ids inside the `config` collection. */
export const CONFIG_DOCS = {
  pricing: 'pricing',
} as const
