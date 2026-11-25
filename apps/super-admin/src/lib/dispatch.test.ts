import { describe, expect, it } from 'vitest'
import { driverDispatchState, type Driver, type Order, type TimestampLike } from '@repo/types'
import {
  DISPATCH_STATUSES,
  canAssign,
  dispatchError,
  driverOptions,
  freeDriverCount,
  groupDispatch,
  isUrgent,
  tabFor,
} from './dispatch'

const NOW = new Date('2026-11-26T10:00:00+02:00')

/** A fake Firestore timestamp, `minutesAgo` before NOW. */
const ago = (minutesAgo: number): TimestampLike => {
  const date = new Date(NOW.getTime() - minutesAgo * 60000)
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date }
}

const address = (suburbId: string) => ({ line1: '1 Main Rd', line2: null, suburbId, suburbName: suburbId })

const order = (id: string, status: Order['status'], extra: Partial<Order> = {}, paidMinutesAgo = 1): Order =>
  ({
    id,
    code: `KK-${id}`,
    status,
    driverUid: null,
    storeAddress: address('benoni-central'),
    deliveryAddress: address('northmead'),
    timestamps: {
      createdAt: ago(paidMinutesAgo + 1),
      paidAt: ago(paidMinutesAgo),
      acceptedAt: null,
      readyAt: null,
      collectedAt: null,
      deliveredAt: null,
      rejectedAt: null,
      cancelledAt: null,
    },
    ...extra,
  }) as Order

const driver = (uid: string, extra: Partial<Driver> = {}): Driver =>
  ({
    uid,
    displayName: `${uid} Driver`,
    firstName: uid,
    approval: 'approved',
    availability: 'available',
    activeOrderId: null,
    operatingSuburbIds: [],
    ...extra,
  }) as Driver

describe('which tab an order is in', () => {
  it('splits by driver and by on-the-way', () => {
    expect(tabFor(order('1', 'pending'))).toBe('needs_driver')
    expect(tabFor(order('2', 'ready', { driverUid: 'd1' }))).toBe('assigned')
    expect(tabFor(order('3', 'out_for_delivery', { driverUid: 'd1' }))).toBe('on_the_way')
  })

  it('only lets you assign before collection', () => {
    expect(canAssign(order('1', 'pending'))).toBe(true)
    expect(canAssign(order('1', 'ready'))).toBe(true)
    expect(canAssign(order('1', 'out_for_delivery'))).toBe(false)
    expect(DISPATCH_STATUSES).not.toContain('awaiting_payment')
  })
})

describe('urgent (red) orders', () => {
  it('ready with no driver is urgent straight away', () => {
    expect(isUrgent(order('1', 'ready'), NOW)).toBe(true)
  })

  it('new or preparing with no driver turns red after 5 minutes', () => {
    expect(isUrgent(order('1', 'pending', {}, 4), NOW)).toBe(false)
    expect(isUrgent(order('1', 'preparing', {}, 5), NOW)).toBe(true)
  })

  it('never urgent once a driver is assigned', () => {
    expect(isUrgent(order('1', 'ready', { driverUid: 'd1' }), NOW)).toBe(false)
  })
})

describe('board grouping', () => {
  it('puts urgent first, then furthest along, then oldest', () => {
    const groups = groupDispatch(
      [
        order('new-old', 'pending', {}, 3),
        order('prep', 'preparing', {}, 2),
        order('ready', 'ready', {}, 1),
        order('new-late', 'pending', {}, 8),
        order('new-young', 'pending', {}, 1),
      ],
      NOW,
    )
    expect(groups.needs_driver.map((o) => o.id)).toEqual(['ready', 'new-late', 'prep', 'new-old', 'new-young'])
  })

  it('ignores orders outside the board statuses', () => {
    const groups = groupDispatch([order('x', 'delivered'), order('y', 'out_for_delivery', { driverUid: 'd1' })], NOW)
    expect(groups.needs_driver).toHaveLength(0)
    expect(groups.on_the_way.map((o) => o.id)).toEqual(['y'])
  })
})

describe('driver availability', () => {
  it('a driver whose last order has ended is free again', () => {
    const d = driver('d1', { availability: 'on_delivery', activeOrderId: 'old' })
    expect(driverDispatchState(d, 'cancelled')).toBe('free')
    expect(driverDispatchState(d, null)).toBe('free')
    expect(driverDispatchState(d, 'preparing')).toBe('busy')
  })

  it('offline and unapproved drivers can’t take jobs', () => {
    expect(driverDispatchState(driver('d1', { availability: 'offline' }), null)).toBe('offline')
    expect(driverDispatchState(driver('d1', { approval: 'suspended' }), null)).toBe('not_approved')
  })
})

describe('the assign-driver sheet', () => {
  const open = [order('busy-job', 'out_for_delivery', { driverUid: 'busy' })]
  const drivers = [
    driver('offline', { availability: 'offline' }),
    driver('busy', { availability: 'on_delivery', activeOrderId: 'busy-job' }),
    driver('far'),
    driver('local', { operatingSuburbIds: ['northmead'] }),
    driver('stale', { availability: 'on_delivery', activeOrderId: 'gone' }),
    driver('current', { availability: 'on_delivery', activeOrderId: 'o1' }),
  ]

  it('ranks current, local free, other free, busy, offline', () => {
    const options = driverOptions(order('o1', 'ready', { driverUid: 'current' }), drivers, open)
    expect(options.map((o) => [o.driver.uid, o.state])).toEqual([
      ['current', 'current'],
      ['local', 'free'],
      ['far', 'free'],
      ['stale', 'free'],
      ['busy', 'busy'],
      ['offline', 'offline'],
    ])
    expect(options.find((o) => o.driver.uid === 'busy')?.busyWith).toBe('KK-busy-job')
    expect(options.find((o) => o.driver.uid === 'local')?.coversArea).toBe(true)
  })

  it('counts free drivers for the board header', () => {
    expect(freeDriverCount(drivers, [...open, order('o1', 'ready', { driverUid: 'current' })])).toBe(3)
  })
})

describe('error messages', () => {
  it('explains races in plain language', () => {
    expect(dispatchError({ name: 'DispatchError', problem: 'driver_busy' })).toMatch(/another job/)
    expect(dispatchError({ name: 'DispatchError', problem: 'order_closed' })).toMatch(/moved on/)
    expect(dispatchError({ code: 'unavailable' })).toMatch(/No connection/)
    expect(dispatchError(new Error('boom'))).toMatch(/try again/)
  })
})
