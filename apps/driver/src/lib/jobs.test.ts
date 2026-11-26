import { describe, expect, it } from 'vitest'
import type { Address, Driver, Order } from '@repo/types'
import {
  addressText,
  approvalGate,
  driverActionError,
  endedJobNotice,
  itemCountText,
  itemLines,
  jobStage,
  mapsUrl,
  onlineControl,
  pickActiveJob,
  shouldClearFinishedJob,
  stageCopy,
} from './jobs'

const order = (id: string, status: Order['status']): Order => ({ id, code: `KK-${id}`, status }) as Order

describe('which job is mine', () => {
  it('ignores finished and unpaid orders', () => {
    const orders = [order('1', 'delivered'), order('2', 'cancelled'), order('3', 'awaiting_payment')]
    expect(pickActiveJob(orders, null)).toBeNull()
  })

  it('finds the open job in any stage', () => {
    for (const status of ['pending', 'preparing', 'ready', 'out_for_delivery'] as const) {
      expect(pickActiveJob([order('9', 'delivered'), order('1', status)], null)?.id).toBe('1')
    }
  })

  it('prefers the job on the driver’s doc, then the oldest (list is newest first)', () => {
    const orders = [order('new', 'ready'), order('old', 'preparing')]
    expect(pickActiveJob(orders, 'new')?.id).toBe('new')
    expect(pickActiveJob(orders, null)?.id).toBe('old')
  })
})

describe('clearing a job that ended without the driver', () => {
  it('clears when the doc points at a cancelled or declined order', () => {
    expect(shouldClearFinishedJob({ activeOrderId: '1' }, [order('1', 'cancelled')])).toBe(true)
    expect(shouldClearFinishedJob({ activeOrderId: '1' }, [order('1', 'rejected')])).toBe(true)
  })

  it('leaves open jobs, missing orders and empty docs alone', () => {
    expect(shouldClearFinishedJob({ activeOrderId: '1' }, [order('1', 'ready')])).toBe(false)
    expect(shouldClearFinishedJob({ activeOrderId: '1' }, [])).toBe(false)
    expect(shouldClearFinishedJob({ activeOrderId: null }, [order('1', 'cancelled')])).toBe(false)
  })
})

describe('job stages', () => {
  it('maps statuses to the three stages', () => {
    expect(jobStage('pending')).toBe('to_store')
    expect(jobStage('preparing')).toBe('to_store')
    expect(jobStage('ready')).toBe('collect')
    expect(jobStage('out_for_delivery')).toBe('deliver')
    expect(jobStage('delivered')).toBeNull()
    expect(jobStage('awaiting_payment')).toBeNull()
  })

  it('names the customer when delivering', () => {
    expect(stageCopy('deliver', 'Thabo').title).toBe('Deliver to Thabo')
  })
})

describe('what happened to my last job', () => {
  const prev = { id: '1', code: 'KK-1' }

  it('says nothing while the job is still on screen', () => {
    expect(endedJobNotice(prev, '1', [order('1', 'ready')], null)).toBeNull()
    expect(endedJobNotice(null, null, [], null)).toBeNull()
  })

  it('celebrates a delivery made on this device', () => {
    expect(endedJobNotice(prev, null, [order('1', 'delivered')], '1')?.tone).toBe('success')
  })

  it('explains reassignment, cancellation and a store decline', () => {
    expect(endedJobNotice(prev, null, [], null)?.text).toContain('another driver')
    expect(endedJobNotice(prev, null, [order('1', 'cancelled')], null)?.text).toContain('cancelled')
    expect(endedJobNotice(prev, null, [order('1', 'rejected')], null)?.text).toContain('declined')
  })
})

describe('online / offline', () => {
  it('can’t go offline during a job', () => {
    expect(onlineControl({ availability: 'on_delivery' }, true)).toMatchObject({ online: true, canToggle: false })
  })

  it('toggles freely without a job', () => {
    expect(onlineControl({ availability: 'available' }, false)).toMatchObject({ online: true, canToggle: true })
    expect(onlineControl({ availability: 'offline' }, false)).toMatchObject({ online: false, canToggle: true })
  })

  it('treats a stale "on delivery" with no job as online', () => {
    expect(onlineControl({ availability: 'on_delivery' }, false).online).toBe(true)
  })
})

describe('approval gate', () => {
  const d = (approval: Driver['approval'], approvalNote: string | null = null) => ({ approval, approvalNote })

  it('lets approved drivers through', () => {
    expect(approvalGate(d('approved'))).toBeNull()
  })

  it('explains every other state', () => {
    expect(approvalGate(null)?.title).toBeTruthy()
    expect(approvalGate(d('applied'))?.title).toBe('Application received')
    expect(approvalGate(d('in_review'))?.title).toBe('Application received')
    expect(approvalGate(d('rejected', 'Licence expired'))?.body).toContain('Licence expired')
    expect(approvalGate(d('suspended'))?.title).toContain('paused')
  })
})

describe('addresses, items, errors', () => {
  const address: Address = { line1: '12 Main Rd', line2: null, suburbId: 'benoni-central', suburbName: 'Benoni Central' }

  it('formats the address and builds a Maps search link', () => {
    expect(addressText(address)).toBe('12 Main Rd, Benoni Central')
    expect(addressText({ ...address, line2: 'Flat 3' })).toBe('12 Main Rd, Flat 3, Benoni Central')
    expect(mapsUrl(address)).toBe(
      'https://www.google.com/maps/search/?api=1&query=12%20Main%20Rd%2C%20Benoni%20Central%2C%20South%20Africa',
    )
  })

  it('lists items without prices and counts units', () => {
    expect(itemLines([{ name: 'White bread', quantity: 2 }])).toEqual(['2 × White bread'])
    expect(itemCountText(1)).toBe('1 item')
    expect(itemCountText(3)).toBe('3 items')
  })

  it('explains refused taps in plain language', () => {
    expect(driverActionError({ code: 'permission-denied' })).toContain('changed')
    expect(driverActionError({ name: 'OrderTransitionError' })).toContain('changed')
    expect(driverActionError({ code: 'unavailable' })).toContain('connection')
    expect(driverActionError(new Error('x'))).toContain('try again')
  })
})
