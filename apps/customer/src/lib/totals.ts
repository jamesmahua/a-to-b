import { calculateOrderPricing, type OrderPricing, type PricingConfig } from '@repo/types'
import type { CartGroup } from './cart'

export interface PricedGroup {
  group: CartGroup
  pricing: OrderPricing
}

/**
 * Prices every store in the cart with the same function `placeOrder()` uses,
 * so the totals on screen always match what's charged.
 *
 * Each store is its own order (one order = one store, spec §10.4), so each one
 * has its own service and delivery fee. Bundling fees across stores is still an
 * open question (spec §12.2); when it's decided, it changes here and in placeOrder.
 */
export function priceCart(groups: CartGroup[], config: PricingConfig): { priced: PricedGroup[]; grandTotalCents: number } {
  const priced = groups.map((group) => ({
    group,
    pricing: calculateOrderPricing(
      group.lines.map((l) => ({ basePriceCents: l.basePriceCents, quantity: l.quantity })),
      config,
    ),
  }))
  return { priced, grandTotalCents: priced.reduce((sum, p) => sum + p.pricing.totalCents, 0) }
}
