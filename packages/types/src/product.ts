import type { Cents, TimestampLike, Vertical } from './common'

/**
 * stores/{storeId}/products/{productId}
 *
 * Only the store's own price is stored. What the customer pays is worked out by
 * `getCustomerUnitPrice()` in pricing.ts, so a change to the revenue model never
 * needs a data migration.
 */
export interface Product {
  id: string
  /** Copied from the parent path, so collection-group search results know their store. */
  storeId: string
  /** Copied from the store, so search can filter by vertical. */
  vertical: Vertical
  categoryId: string
  name: string
  /** Lowercase copy of `name`, for prefix search. */
  nameLower: string
  /** Lowercase words from the name and tags, for `array-contains` search. */
  keywords: string[]
  description: string
  /** The store's price per unit, in cents. */
  basePriceCents: Cents
  inStock: boolean
  /** Hidden from customers when false (soft delete). */
  active: boolean
  imageUrl: string | null
  sort: number
  createdAt: TimestampLike
  updatedAt: TimestampLike
}

/** Builds the `keywords` array: lowercase words of 2+ letters, no duplicates. */
export function buildKeywords(...texts: string[]): string[] {
  const words = texts
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2)
  return [...new Set(words)]
}
