/**
 * @repo/types — the Klick&Kolleka data model.
 *
 * Pure TypeScript: no Firebase, no React. Safe to import from every app
 * (Expo, Next.js) and from scripts.
 *
 * Collections:
 *   users/{uid}                       UserProfile
 *     └─ devices/{deviceId}           UserDevice
 *   stores/{storeId}                  Store
 *     └─ products/{productId}         Product
 *   orders/{orderId}                  Order
 *   drivers/{uid}                     Driver
 *   suburbs/{suburbId}                Suburb
 *   config/pricing                    PricingConfig
 */
export * from './common'
export * from './roles'
export * from './user'
export * from './location'
export * from './store'
export * from './product'
export * from './pricing'
export * from './order'
export * from './driver'
export * from './time'
