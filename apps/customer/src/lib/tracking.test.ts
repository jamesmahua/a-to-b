import { describe, expect, it } from 'vitest'
import type { Order, OrderTimestamps, TimestampLike } from '@repo/types'
import { getTracking } from './tracking'

/** A fake Firestore timestamp for tests. */
const at = (iso: string): TimestampLike => {
  const d = new Date(iso)
  return { seconds: d.getTime() / 1000, nanoseconds: 0, toDate: () => d }
}

const noStamps: OrderTimestamps = {
  createdAt: at('2026-11-25T18:00:00Z'),
  paidAt: null,
  acceptedAt: null,
  readyAt: null,
  collectedAt: null,
  deliveredAt: null,
  rejectedAt: null,
  cancelledAt: null,
}

function order(changes: Partial<Order> = {}, stamps: Partial<OrderTimestamps> = {}) {
  return {
    status: 'pending' as Order['status'],
    storeName: 'Kasi Kota Corner',
    driverFirstName: null,
    rejectReason: null,
    cancellation: null,
    ...changes,
    timestamps: { ...noStamps, ...stamps },
  }
}

const states = (o: ReturnType<typeof order>) => getTracking(o).steps.map((s) => s.state)

describe('getTracking', () => {
  it('pending: placed is done, the store accepting is current', () => {
    const t = getTracking(order({}, { paidAt: at('2026-11-25T18:01:00Z') }))
    expect(t.headline).toBe('Waiting for Kasi Kota Corner to accept')
    expect(t.steps.map((s) => s.state)).toEqual(['done', 'current', 'upcoming', 'upcoming', 'upcoming'])
    expect(t.steps[0]!.at?.toISOString()).toBe('2026-11-25T18:01:00.000Z')
    expect(t.finished).toBe(false)
  })

  it('each status moves the current step along', () => {
    expect(states(order({ status: 'awaiting_payment' }))).toEqual(['current', 'upcoming', 'upcoming', 'upcoming', 'upcoming'])
    expect(states(order({ status: 'preparing' }))).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming'])
    expect(states(order({ status: 'out_for_delivery' }))).toEqual(['done', 'done', 'done', 'done', 'current'])
    expect(states(order({ status: 'delivered' }))).toEqual(['done', 'done', 'done', 'done', 'done'])
  })

  it('uses the driver’s first name once one is assigned', () => {
    expect(getTracking(order({ status: 'out_for_delivery', driverFirstName: 'Sipho' })).headline).toBe('Sipho is on the way')
    expect(getTracking(order({ status: 'out_for_delivery' })).headline).toBe('Your driver is on the way')
  })

  it('rejected: shows the reason and skips the rest', () => {
    const t = getTracking(order({ status: 'rejected', rejectReason: 'out_of_stock' }))
    expect(t.detail).toBe('Reason: Out of stock.')
    expect(t.steps.map((s) => s.state)).toEqual(['done', 'skipped', 'skipped', 'skipped', 'skipped'])
    expect(t.problem).toBe(true)
    expect(t.finished).toBe(true)
  })

  it('cancelled: keeps what really happened, says who cancelled', () => {
    const t = getTracking(
      order(
        { status: 'cancelled', cancellation: { by: 'super_admin', reason: 'No drivers' } },
        { paidAt: at('2026-11-25T18:01:00Z'), acceptedAt: at('2026-11-25T18:03:00Z') },
      ),
    )
    expect(t.steps.map((s) => s.state)).toEqual(['done', 'done', 'skipped', 'skipped', 'skipped'])
    expect(t.detail).toBe('Klick&Kolleka cancelled this order.')
  })
})
