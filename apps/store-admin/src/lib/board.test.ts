import { describe, expect, it } from 'vitest'
import type { Order, TimestampLike } from '@repo/types'
import {
  BOARD_STATUSES,
  boardActionError,
  formatWaiting,
  groupByTab,
  isUrgent,
  itemSummary,
  minutesSince,
  stageStartedAt,
  tabLabel,
} from './board'

const NOW = new Date('2026-11-26T10:00:00+02:00')

/** A fake Firestore timestamp, `minutesAgo` before NOW. */
const ago = (minutesAgo: number): TimestampLike => {
  const date = new Date(NOW.getTime() - minutesAgo * 60000)
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date }
}

const order = (id: string, status: Order['status'], t: Partial<Order['timestamps']> = {}): Order =>
  ({
    id,
    status,
    timestamps: {
      createdAt: ago(30),
      paidAt: null,
      acceptedAt: null,
      readyAt: null,
      collectedAt: null,
      deliveredAt: null,
      rejectedAt: null,
      cancelledAt: null,
      ...t,
    },
  }) as Order

describe('board tabs', () => {
  it('listens for exactly the three board statuses', () => {
    expect(BOARD_STATUSES).toEqual(['pending', 'preparing', 'ready'])
  })

  it('groups orders into tabs, oldest first, ignoring other statuses', () => {
    const groups = groupByTab([
      order('newer', 'pending', { paidAt: ago(2) }),
      order('older', 'pending', { paidAt: ago(9) }),
      order('cooking', 'preparing', { acceptedAt: ago(5) }),
      order('bagged', 'ready', { readyAt: ago(1) }),
      order('gone', 'out_for_delivery'),
    ])
    expect(groups.new.map((o) => o.id)).toEqual(['older', 'newer'])
    expect(groups.preparing.map((o) => o.id)).toEqual(['cooking'])
    expect(groups.ready.map((o) => o.id)).toEqual(['bagged'])
  })

  it('puts an order whose server time has not arrived yet at the bottom', () => {
    const groups = groupByTab([order('fresh', 'preparing'), order('known', 'preparing', { acceptedAt: ago(3) })])
    expect(groups.preparing.map((o) => o.id)).toEqual(['known', 'fresh'])
  })

  it('shows a count only when the tab has orders', () => {
    expect(tabLabel('New order', 0)).toBe('New order')
    expect(tabLabel('New order', 3)).toBe('New order (3)')
  })
})

describe('waiting time', () => {
  it('measures each stage from when it started', () => {
    const secs = (o: Order) => stageStartedAt(o)?.seconds
    expect(secs(order('a', 'pending', { paidAt: ago(4) }))).toBe(ago(4).seconds)
    expect(secs(order('b', 'pending'))).toBe(ago(30).seconds) // falls back to createdAt
    expect(secs(order('c', 'ready', { readyAt: ago(2) }))).toBe(ago(2).seconds)
    expect(stageStartedAt(order('d', 'delivered'))).toBeNull()
  })

  it('formats minutes in plain language', () => {
    expect(formatWaiting(null)).toBe('Just now')
    expect(formatWaiting(0)).toBe('Just now')
    expect(formatWaiting(7)).toBe('7 min')
    expect(formatWaiting(65)).toBe('1 h 05 min')
    expect(minutesSince(ago(12), NOW)).toBe(12)
    expect(minutesSince(null, NOW)).toBeNull()
  })

  it('flags only new orders that have waited 5 minutes or more', () => {
    expect(isUrgent(order('a', 'pending', { paidAt: ago(4) }), NOW)).toBe(false)
    expect(isUrgent(order('b', 'pending', { paidAt: ago(5) }), NOW)).toBe(true)
    expect(isUrgent(order('c', 'preparing', { acceptedAt: ago(40) }), NOW)).toBe(false)
  })
})

describe('item summary', () => {
  it('lists the first three items and counts the rest', () => {
    const items = ['Bread', 'Milk', 'Eggs', 'Sugar', 'Tea'].map((name, i) => ({ name, quantity: i + 1 }))
    expect(itemSummary(items)).toEqual({ lines: ['1 × Bread', '2 × Milk', '3 × Eggs'], more: 2 })
    expect(itemSummary(items.slice(0, 2))).toEqual({ lines: ['1 × Bread', '2 × Milk'], more: 0 })
  })
})

describe('error messages', () => {
  it('explains a refused move in plain language', () => {
    expect(boardActionError({ code: 'permission-denied' })).toMatch(/changed before your tap/)
    expect(boardActionError({ name: 'OrderTransitionError' })).toMatch(/changed before your tap/)
    expect(boardActionError({ code: 'unavailable' })).toMatch(/No connection/)
    expect(boardActionError(new Error('boom'))).toMatch(/try again/)
  })
})
