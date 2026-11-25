import { describe, expect, it } from 'vitest'
import type { Order, TimestampLike } from '@repo/types'
import { STORE_STATUS_LABELS, formatClock, stageText, payoutRows, storeLines, storeTimeline } from './order-detail'

const at = (iso: string): TimestampLike => {
  const date = new Date(iso)
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date }
}

const timestamps = (t: Partial<Order['timestamps']> = {}): Order['timestamps'] => ({
  createdAt: at('2026-11-25T21:00:00+02:00'),
  paidAt: null,
  acceptedAt: null,
  readyAt: null,
  collectedAt: null,
  deliveredAt: null,
  rejectedAt: null,
  cancelledAt: null,
  ...t,
})

describe('store lines', () => {
  it('uses the store price snapshot, not the customer price', () => {
    const lines = storeLines({
      items: [
        { productId: 'coke', name: 'Coca-Cola 2L', quantity: 1, unitBasePriceCents: 2599, unitPriceCents: 2911, lineTotalCents: 2911 },
        { productId: 'chips', name: 'Simba 120g', quantity: 2, unitBasePriceCents: 2099, unitPriceCents: 2351, lineTotalCents: 4702 },
      ],
    })
    expect(lines.map((l) => [l.name, l.unitCents, l.lineCents])).toEqual([
      ['Coca-Cola 2L', 2599, 2599],
      ['Simba 120g', 2099, 4198],
    ])
  })
})

describe('payout rows', () => {
  it('hides the commission row when there is no commission', () => {
    const rows = payoutRows({ storeSubtotalCents: 6797, commissionCents: 0, storePayoutCents: 6797 })
    expect(rows.map((r) => r.label)).toEqual(['Items at your prices', 'You receive'])
    expect(rows[1]).toMatchObject({ cents: 6797, total: true })
  })

  it('shows the commission as a deduction when there is one', () => {
    const rows = payoutRows({ storeSubtotalCents: 10000, commissionCents: 1000, storePayoutCents: 9000 })
    expect(rows).toEqual([
      { label: 'Items at your prices', cents: 10000 },
      { label: 'Klick&Kolleka commission', cents: 1000, deduction: true },
      { label: 'You receive', cents: 9000, total: true },
    ])
  })
})

describe('timeline', () => {
  it('shows every step for an open order, with only the past ones done', () => {
    const steps = storeTimeline({
      status: 'preparing',
      timestamps: timestamps({ paidAt: at('2026-11-25T21:01:00+02:00'), acceptedAt: at('2026-11-25T21:04:00+02:00') }),
      rejectReason: null,
      cancellation: null,
    })
    expect(steps.map((s) => [s.label, s.done])).toEqual([
      ['Paid', true],
      ['Accepted', true],
      ['Ready for collection', false],
      ['Collected by driver', false],
      ['Delivered', false],
    ])
  })

  it('ends a declined order with the reason', () => {
    const steps = storeTimeline({
      status: 'rejected',
      timestamps: timestamps({ paidAt: at('2026-11-25T21:01:00+02:00'), rejectedAt: at('2026-11-25T21:03:00+02:00') }),
      rejectReason: 'out_of_stock',
      cancellation: null,
    })
    expect(steps.map((s) => s.label)).toEqual(['Paid', 'Declined by you (out of stock)'])
  })

  it('says who cancelled', () => {
    const steps = storeTimeline({
      status: 'cancelled',
      timestamps: timestamps({ paidAt: at('2026-11-25T21:01:00+02:00'), cancelledAt: at('2026-11-25T21:02:00+02:00') }),
      rejectReason: null,
      cancellation: { by: 'customer', reason: null },
    })
    expect(steps.map((s) => s.label)).toEqual(['Paid', 'Cancelled by the customer'])
  })
})

describe('labels and times', () => {
  it('uses store-side wording', () => {
    expect(STORE_STATUS_LABELS.rejected).toBe('Declined')
    expect(STORE_STATUS_LABELS.pending).toBe('New order')
  })

  it('adds the date only when it was not today', () => {
    const now = new Date('2026-11-26T10:00:00')
    expect(formatClock(new Date('2026-11-26T09:05:00'), now)).toMatch(/09:05/)
    expect(formatClock(new Date('2026-11-26T09:05:00'), now)).not.toMatch(/Nov/)
    expect(formatClock(new Date('2026-11-25T21:10:00'), now)).toMatch(/25 Nov.*21:10/)
  })
})

describe('stage text', () => {
  it('reads naturally for each stage', () => {
    expect(stageText('pending', 0)).toBe('Just came in')
    expect(stageText('pending', 6)).toBe('Waiting 6 min')
    expect(stageText('preparing', 12)).toBe('Preparing for 12 min')
    expect(stageText('ready', 65)).toBe('Ready for 1 h 05 min')
    expect(stageText('delivered', 3)).toBeNull()
  })
})
