import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRICING,
  ORDER_STATUSES,
  TERMINAL_STATUSES,
  buildKeywords,
  calculateOrderPricing,
  canTransition,
  formatRand,
  getCustomerUnitPrice,
  nextStatusesFor,
} from './index'

describe('pricing', () => {
  it('adds 12% markup per unit, rounded to the cent', () => {
    expect(getCustomerUnitPrice(1000, DEFAULT_PRICING)).toBe(1120)
    expect(getCustomerUnitPrice(1299, DEFAULT_PRICING)).toBe(1299 + 156) // 155.88 → 156
  })

  it('works out a small spaza basket (spec §9.2: ~R150 order)', () => {
    const p = calculateOrderPricing(
      [
        { basePriceCents: 2499, quantity: 2 }, // bread
        { basePriceCents: 4599, quantity: 1 }, // sugar
        { basePriceCents: 1299, quantity: 3 }, // chips
      ],
      DEFAULT_PRICING,
    )
    expect(p.storeSubtotalCents).toBe(2499 * 2 + 4599 + 1299 * 3)
    expect(p.subtotalCents).toBe(2799 * 2 + 5151 + 1455 * 3)
    expect(p.totalCents).toBe(p.subtotalCents + 1500 + 1500)
    expect(p.storePayoutCents).toBe(p.storeSubtotalCents)
    expect(p.driverPayoutCents).toBe(1500)
    // Every cent the customer pays goes to exactly one party
    expect(p.storePayoutCents + p.driverPayoutCents + p.platformRevenueCents).toBe(p.totalCents)
    expect(p.platformRevenueCents).toBe(p.markupCents + p.serviceFeeCents)
  })

  it('supports the vendor-commission model by config alone', () => {
    const p = calculateOrderPricing([{ basePriceCents: 10000, quantity: 1 }], {
      ...DEFAULT_PRICING,
      markupBps: 300,
      commissionBps: 1000,
      serviceFeeCents: 500,
    }, 1000)
    expect(p.commissionCents).toBe(1000)
    expect(p.storePayoutCents).toBe(9000)
    expect(p.driverPayoutCents).toBe(1500 + 1000) // delivery + tip
    expect(p.storePayoutCents + p.driverPayoutCents + p.platformRevenueCents).toBe(p.totalCents)
  })

  it('rejects bad quantities', () => {
    expect(() => calculateOrderPricing([{ basePriceCents: 100, quantity: 0 }], DEFAULT_PRICING)).toThrow()
    expect(() => calculateOrderPricing([{ basePriceCents: 100, quantity: 1.5 }], DEFAULT_PRICING)).toThrow()
  })

  it('formats money the design-system way', () => {
    expect(formatRand(8900)).toBe('R89')
    expect(formatRand(12950)).toBe('R129.50')
    expect(formatRand(125000)).toBe('R1 250')
    expect(formatRand(5)).toBe('R0.05')
  })
})

describe('order transitions', () => {
  it('lets the store accept, reject and mark ready', () => {
    expect(canTransition('store_admin', 'pending', 'preparing')).toBe(true)
    expect(canTransition('store_admin', 'pending', 'rejected')).toBe(true)
    expect(canTransition('store_admin', 'preparing', 'ready')).toBe(true)
    expect(nextStatusesFor('store_admin', 'pending')).toEqual(['preparing', 'rejected'])
  })

  it('stops the store skipping steps or doing the driver’s job', () => {
    expect(canTransition('store_admin', 'pending', 'ready')).toBe(false)
    expect(canTransition('store_admin', 'ready', 'out_for_delivery')).toBe(false)
    expect(canTransition('store_admin', 'preparing', 'cancelled')).toBe(false)
  })

  it('lets the driver collect and deliver only', () => {
    expect(nextStatusesFor('driver', 'ready')).toEqual(['out_for_delivery'])
    expect(nextStatusesFor('driver', 'out_for_delivery')).toEqual(['delivered'])
    expect(nextStatusesFor('driver', 'preparing')).toEqual([])
  })

  it('lets the customer cancel only before the store accepts', () => {
    expect(canTransition('customer', 'pending', 'cancelled')).toBe(true)
    expect(canTransition('customer', 'preparing', 'cancelled')).toBe(false)
  })

  it('has no way out of a finished order', () => {
    for (const end of TERMINAL_STATUSES) {
      for (const role of ['customer', 'store_admin', 'driver', 'super_admin'] as const) {
        expect(nextStatusesFor(role, end)).toEqual([])
      }
    }
  })

  it('lets super admin cancel anything still open', () => {
    for (const s of ORDER_STATUSES) {
      if (!TERMINAL_STATUSES.includes(s)) expect(canTransition('super_admin', s, 'cancelled')).toBe(true)
    }
  })
})

describe('keywords', () => {
  it('lowercases, splits and de-duplicates', () => {
    expect(buildKeywords('Albany Brown Bread 700g', 'bread loaf')).toEqual(['albany', 'brown', 'bread', '700g', 'loaf'])
  })
})
