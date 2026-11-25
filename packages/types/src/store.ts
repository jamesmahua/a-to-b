import type { TimestampLike, Vertical } from './common'
import type { Address } from './location'

/** Has K&K approved this store to trade? Set by super admin only. */
export const STORE_APPROVALS = ['pending', 'approved', 'suspended'] as const
export type StoreApproval = (typeof STORE_APPROVALS)[number]

/** The store's own switch: can customers order right now? */
export const TRADING_STATUSES = ['open', 'paused', 'closed'] as const
export type TradingStatus = (typeof TRADING_STATUSES)[number]

export const TRADING_STATUS_LABELS: Record<TradingStatus, string> = {
  open: 'Open',
  paused: 'Paused (too busy)',
  closed: 'Closed',
}

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof WEEKDAYS)[number]

/** "08:00"–"20:00" in SA time. `null` = closed that day. */
export type OpeningHours = Record<Weekday, { open: string; close: string } | null>

/** Product categories live on the store doc, so the store page loads in one read. */
export interface StoreCategory {
  id: string
  name: string
  sort: number
}

/**
 * stores/{storeId}
 * Public: anyone can read an approved store, even before logging in.
 */
export interface Store {
  id: string
  name: string
  /** Lowercase copy of `name`, for prefix search. */
  nameLower: string
  vertical: Vertical
  description: string
  /** uid of the store admin who owns it. */
  ownerUid: string
  phone: string
  address: Address
  /** Suburbs this store delivers to. Customers query with `array-contains`. */
  deliverySuburbIds: string[]
  approval: StoreApproval
  tradingStatus: TradingStatus
  hours: OpeningHours
  categories: StoreCategory[]
  /** Optional until Firebase Storage is set up. UI falls back to a tile in the vertical's colour. */
  imageUrl: string | null
  createdAt: TimestampLike
  updatedAt: TimestampLike
}
