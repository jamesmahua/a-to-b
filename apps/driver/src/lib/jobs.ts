/**
 * The driver's delivery flow as plain functions (no React, no Firebase), so it
 * can be unit tested. Screens in app/ and components/ only render what these return.
 *
 *   assigned (store still preparing) → collect (ready) → deliver (on the way) → done
 */
import { TERMINAL_STATUSES, type Address, type Driver, type Order, type OrderItem, type OrderStatus } from '@repo/types'

// ── Which job is mine right now ───────────────────────────────────────────────

/** Statuses where an assigned order is still a job for the driver. */
const OPEN_JOB_STATUSES: readonly OrderStatus[] = ['pending', 'preparing', 'ready', 'out_for_delivery']

export const isOpenJob = (order: Pick<Order, 'status'>): boolean => OPEN_JOB_STATUSES.includes(order.status)

/**
 * The driver's current job from their live order list (newest first).
 * v1 gives one job per driver, so normally there's at most one open order.
 * If there were ever two, the one on the driver's doc wins, then the oldest.
 */
export function pickActiveJob(orders: Order[], activeOrderId: string | null): Order | null {
  const open = orders.filter(isOpenJob)
  if (open.length === 0) return null
  return open.find((o) => o.id === activeOrderId) ?? open[open.length - 1] ?? null
}

/**
 * True when the driver's doc still points at a job that has ended without them
 * (cancelled, declined). The app then clears it, as spec §10.2 asks.
 * Delivered jobs are cleared by `markOrderDelivered()` itself.
 */
export function shouldClearFinishedJob(driver: Pick<Driver, 'activeOrderId'>, orders: Pick<Order, 'id' | 'status'>[]): boolean {
  if (!driver.activeOrderId) return false
  const job = orders.find((o) => o.id === driver.activeOrderId)
  return !!job && TERMINAL_STATUSES.includes(job.status)
}

// ── Stages of a job ───────────────────────────────────────────────────────────

export type JobStage = 'to_store' | 'collect' | 'deliver'

export function jobStage(status: OrderStatus): JobStage | null {
  if (status === 'pending' || status === 'preparing') return 'to_store'
  if (status === 'ready') return 'collect'
  if (status === 'out_for_delivery') return 'deliver'
  return null
}

/** Headline and one-line help for each stage. */
export function stageCopy(stage: JobStage, customerFirstName: string): { title: string; hint: string } {
  switch (stage) {
    case 'to_store':
      return {
        title: 'Head to the store',
        hint: 'The store is still getting the order ready. You can collect it once they mark it ready.',
      }
    case 'collect':
      return {
        title: 'Collect the order',
        hint: 'Show your code at the counter, check the bag, then tap “I’ve collected it”.',
      }
    case 'deliver':
      return {
        title: `Deliver to ${customerFirstName}`,
        hint: 'Hand the order over, then tap “Delivered”.',
      }
  }
}

/** Short label for the status tag on the job card. */
export const STAGE_TAG: Record<JobStage, string> = {
  to_store: 'Store preparing',
  collect: 'Ready to collect',
  deliver: 'On the way',
}

// ── What happened to my last job ──────────────────────────────────────────────

export interface JobNotice {
  tone: 'success' | 'info'
  text: string
}

/**
 * When the job on screen goes away, tell the driver why, in one line.
 *
 * @param previous   the job that was on screen a moment ago
 * @param currentId  the job on screen now (null if none)
 * @param orders     the driver's live order list
 * @param deliveredId the order this driver just marked delivered on this device, if any
 */
export function endedJobNotice(
  previous: Pick<Order, 'id' | 'code'> | null,
  currentId: string | null,
  orders: Pick<Order, 'id' | 'status'>[],
  deliveredId: string | null,
): JobNotice | null {
  if (!previous || previous.id === currentId) return null
  if (previous.id === deliveredId) {
    return { tone: 'success', text: `Sharp! ${previous.code} delivered. You’re free for the next job.` }
  }
  const now = orders.find((o) => o.id === previous.id)
  // Gone from the list: dispatch gave it to someone else (and freed this driver).
  if (!now) return { tone: 'info', text: `${previous.code} was given to another driver. You’re free for the next job.` }
  switch (now.status) {
    case 'cancelled':
      return { tone: 'info', text: `${previous.code} was cancelled, so there’s nothing to collect. You’re free for the next job.` }
    case 'rejected':
      return { tone: 'info', text: `The store declined ${previous.code}, so there’s nothing to collect. You’re free for the next job.` }
    case 'delivered':
      return { tone: 'info', text: `${previous.code} was marked delivered by K&K support.` }
    default:
      return null
  }
}

// ── Online / offline ──────────────────────────────────────────────────────────

export interface OnlineControl {
  online: boolean
  /** False during a job: finish it first. */
  canToggle: boolean
  hint: string
}

export function onlineControl(driver: Pick<Driver, 'availability'>, hasJob: boolean): OnlineControl {
  const online = driver.availability !== 'offline'
  if (hasJob) return { online: true, canToggle: false, hint: 'You can go offline once this job is done.' }
  return online
    ? { online, canToggle: true, hint: 'K&K can give you a job now. It appears here by itself, so keep the app open.' }
    : { online, canToggle: true, hint: 'Go online when you’re ready to take jobs.' }
}

// ── Not approved yet ──────────────────────────────────────────────────────────

/**
 * What to show a driver who can't take jobs yet. `null` = approved, show the job screen.
 * Onboarding (applying in the app) is a later step of §10.2.
 */
export function approvalGate(driver: Pick<Driver, 'approval' | 'approvalNote'> | null): { title: string; body: string } | null {
  if (!driver) {
    return {
      title: 'Your application isn’t in yet',
      body: 'Applying to drive is coming to the app soon. Once K&K approves you, your jobs appear here.',
    }
  }
  switch (driver.approval) {
    case 'approved':
      return null
    case 'applied':
    case 'in_review':
      return {
        title: 'Application received',
        body: 'We’re checking your documents. You can start taking jobs as soon as you’re approved.',
      }
    case 'rejected':
      return {
        title: 'Application not approved',
        body: driver.approvalNote ? `Reason: ${driver.approvalNote}` : 'Contact K&K support if you’d like to know more.',
      }
    case 'suspended':
      return {
        title: 'Your account is paused',
        body: 'You can’t take jobs right now. Contact K&K support to sort it out.',
      }
  }
}

// ── Addresses, items, errors ──────────────────────────────────────────────────

/** "12 Main Rd, Flat 3, Benoni Central" */
export function addressText(address: Address): string {
  return [address.line1, address.line2, address.suburbName].filter(Boolean).join(', ')
}

/**
 * Opens Google Maps (the app on a phone, the website in a browser) searching for
 * the address. No map inside K&K, so no map data until the driver taps.
 */
export function mapsUrl(address: Address): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addressText(address)}, South Africa`)}`
}

/** "2 × White bread", so the driver can check the bag. No prices: the driver doesn't need them. */
export function itemLines(items: Pick<OrderItem, 'name' | 'quantity'>[]): string[] {
  return items.map((i) => `${i.quantity} × ${i.name}`)
}

/** "3 items" / "1 item" (units, as on the store's board). */
export function itemCountText(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

/**
 * Turns a failed tap into plain language. Usually the job changed first
 * (cancelled, or given to another driver), so the rules refused the move.
 */
export function driverActionError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  const name = (error as { name?: string } | null)?.name
  if (code === 'permission-denied' || name === 'OrderTransitionError') {
    return 'This job changed before your tap went through, for example it was cancelled or given to another driver. The screen shows the latest.'
  }
  if (code === 'unavailable') return 'No connection right now. Check your data or Wi-Fi and try again.'
  return 'That didn’t work. Please try again.'
}
