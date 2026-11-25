/**
 * Typed references to every collection. Use these instead of raw paths, so a
 * read gives you a `Store`, not `any`.
 */
import {
  collection,
  collectionGroup,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type FirestoreDataConverter,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import {
  COLLECTIONS,
  CONFIG_DOCS,
  type Driver,
  type Order,
  type PricingConfig,
  type Product,
  type Store,
  type Suburb,
  type UserDevice,
  type UserProfile,
} from '@repo/types'
import { getDb } from './app'

/**
 * Puts the doc id into `id` (or `uid`) on read.
 * `id` is left out on write (the path already holds it). `uid` is kept, because
 * the security rules check it matches the signed-in user.
 */
function converter<T extends object>(
  idField: keyof T & string = 'id' as keyof T & string,
  keepIdOnWrite = false,
): FirestoreDataConverter<T> {
  return {
    toFirestore(model) {
      if (keepIdOnWrite) return model as DocumentData
      const { [idField]: _omit, ...rest } = model as Record<string, unknown>
      void _omit
      return rest as DocumentData
    },
    fromFirestore(snap: QueryDocumentSnapshot) {
      return { ...snap.data(), [idField]: snap.id } as T
    },
  }
}

const userConverter = converter<UserProfile>('uid', true)
const driverConverter = converter<Driver>('uid', true)
const storeConverter = converter<Store>()
const productConverter = converter<Product>()
const orderConverter = converter<Order>()
const suburbConverter = converter<Suburb>()
const deviceConverter = converter<UserDevice>()

export const usersCol = (): CollectionReference<UserProfile> =>
  collection(getDb(), COLLECTIONS.users).withConverter(userConverter)
export const userRef = (uid: string): DocumentReference<UserProfile> => doc(usersCol(), uid)

export const devicesCol = (uid: string): CollectionReference<UserDevice> =>
  collection(getDb(), COLLECTIONS.users, uid, COLLECTIONS.devices).withConverter(deviceConverter)

export const storesCol = (): CollectionReference<Store> =>
  collection(getDb(), COLLECTIONS.stores).withConverter(storeConverter)
export const storeRef = (storeId: string): DocumentReference<Store> => doc(storesCol(), storeId)

export const productsCol = (storeId: string): CollectionReference<Product> =>
  collection(getDb(), COLLECTIONS.stores, storeId, COLLECTIONS.products).withConverter(productConverter)
export const productRef = (storeId: string, productId: string): DocumentReference<Product> =>
  doc(productsCol(storeId), productId)
/** Every product in every store, for search. Always filter on `active == true`. */
export const allProducts = (): Query<Product> =>
  collectionGroup(getDb(), COLLECTIONS.products).withConverter(productConverter)

export const ordersCol = (): CollectionReference<Order> =>
  collection(getDb(), COLLECTIONS.orders).withConverter(orderConverter)
export const orderRef = (orderId: string): DocumentReference<Order> => doc(ordersCol(), orderId)

export const driversCol = (): CollectionReference<Driver> =>
  collection(getDb(), COLLECTIONS.drivers).withConverter(driverConverter)
export const driverRef = (uid: string): DocumentReference<Driver> => doc(driversCol(), uid)

export const suburbsCol = (): CollectionReference<Suburb> =>
  collection(getDb(), COLLECTIONS.suburbs).withConverter(suburbConverter)

export const pricingRef = (): DocumentReference<PricingConfig> =>
  doc(getDb(), COLLECTIONS.config, CONFIG_DOCS.pricing) as DocumentReference<PricingConfig>
