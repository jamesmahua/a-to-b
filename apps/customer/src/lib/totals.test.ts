import { describe, expect, it } from 'vitest'
import { DEFAULT_PRICING, type PricingConfig } from '@repo/types'
import { groupCart, type CartLine } from './cart-logic'
import { priceCart } from './totals'

const config = DEFAULT_PRICING as PricingConfig // 12% markup, R15 service, R15 delivery

const lines: CartLine[] = [
  { storeId: 'spaza', productId: 'bread', name: 'Bread', basePriceCents: 2000, quantity: 2 },
  { storeId: 'kota', productId: 'kota', name: 'Kota', basePriceCents: 5000, quantity: 1 },
]
const stores = {
  spaza: { id: 'spaza', name: 'Spaza', vertical: 'essentials' as const },
  kota: { id: 'kota', name: 'Kota', vertical: 'food' as const },
}

describe('priceCart', () => {
  it('prices each store as its own order, each with its own fees', () => {
    const { priced, grandTotalCents } = priceCart(groupCart(lines, stores), config)
    // Spaza: 2 × (R20 + 12%) = R44.80, + R15 + R15 = R74.80
    expect(priced[0]!.pricing.subtotalCents).toBe(4480)
    expect(priced[0]!.pricing.totalCents).toBe(7480)
    // Kota: R50 + 12% = R56, + R30 fees = R86
    expect(priced[1]!.pricing.totalCents).toBe(8600)
    expect(grandTotalCents).toBe(7480 + 8600)
  })
})
