import type { Cents, TimestampLike } from './common'

/**
 * config/pricing
 *
 * Every number in the revenue model lives here. Changing who pays (customer fees vs
 * vendor commission, spec §12.1) means editing this document, not the schema.
 *
 * "bps" = basis points: 1200 bps = 12%.
 */
export interface PricingConfig {
  /** Bumped on every change. Orders record the version they were priced with. */
  version: number
  /** Added to each product's store price. 1200 = 12%. */
  markupBps: number
  /** Flat fee per order. */
  serviceFeeCents: Cents
  /** Flat delivery fee per order (one per store in v1). */
  deliveryFeeCents: Cents
  /** Taken from the store's share. 0 = customer-paid model only. */
  commissionBps: number
  /** Share of the delivery fee paid to the driver. 10000 = all of it. */
  driverDeliveryShareBps: number
  updatedAt: TimestampLike
}

/** Spec §3 defaults: ~12% markup, R15 service, R15 delivery, no commission. */
export const DEFAULT_PRICING: Omit<PricingConfig, 'updatedAt'> = {
  version: 1,
  markupBps: 1200,
  serviceFeeCents: 1500,
  deliveryFeeCents: 1500,
  commissionBps: 0,
  driverDeliveryShareBps: 10000,
}

/** The full money breakdown saved on every order. Old orders keep the prices they were charged. */
export interface OrderPricing {
  pricingVersion: number
  /** Sum of the store's prices (what the store charges). */
  storeSubtotalCents: Cents
  /** Sum of customer prices (store price + markup). */
  subtotalCents: Cents
  markupCents: Cents
  serviceFeeCents: Cents
  deliveryFeeCents: Cents
  tipCents: Cents
  /** What the customer pays: subtotal + service + delivery + tip. */
  totalCents: Cents
  commissionCents: Cents
  /** What the store receives: store subtotal − commission. */
  storePayoutCents: Cents
  /** What the driver receives: their share of delivery + the whole tip. */
  driverPayoutCents: Cents
  /** What K&K keeps: total − store payout − driver payout. */
  platformRevenueCents: Cents
}

const applyBps = (amount: Cents, bps: number): Cents => Math.round((amount * bps) / 10000)

/** What the customer pays for one unit. Markup is applied per unit, so price × qty always matches the line total shown. */
export function getCustomerUnitPrice(basePriceCents: Cents, config: Pick<PricingConfig, 'markupBps'>): Cents {
  return basePriceCents + applyBps(basePriceCents, config.markupBps)
}

export interface PricingLineInput {
  basePriceCents: Cents
  quantity: number
}

/** Works out the full money breakdown for one store's order. Pure function: same inputs, same answer. */
export function calculateOrderPricing(
  lines: PricingLineInput[],
  config: Omit<PricingConfig, 'updatedAt'>,
  tipCents: Cents = 0,
): OrderPricing {
  let storeSubtotalCents = 0
  let subtotalCents = 0
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`Invalid quantity: ${line.quantity}`)
    }
    storeSubtotalCents += line.basePriceCents * line.quantity
    subtotalCents += getCustomerUnitPrice(line.basePriceCents, config) * line.quantity
  }
  const markupCents = subtotalCents - storeSubtotalCents
  const { serviceFeeCents, deliveryFeeCents } = config
  const totalCents = subtotalCents + serviceFeeCents + deliveryFeeCents + tipCents
  const commissionCents = applyBps(storeSubtotalCents, config.commissionBps)
  const storePayoutCents = storeSubtotalCents - commissionCents
  const driverPayoutCents = applyBps(deliveryFeeCents, config.driverDeliveryShareBps) + tipCents
  const platformRevenueCents = totalCents - storePayoutCents - driverPayoutCents

  return {
    pricingVersion: config.version,
    storeSubtotalCents,
    subtotalCents,
    markupCents,
    serviceFeeCents,
    deliveryFeeCents,
    tipCents,
    totalCents,
    commissionCents,
    storePayoutCents,
    driverPayoutCents,
    platformRevenueCents,
  }
}

/** R89, R129.50, R1 250 — the design system's money format. */
export function formatRand(cents: Cents): string {
  const negative = cents < 0
  const abs = Math.abs(cents)
  const rands = Math.floor(abs / 100)
  const rest = abs % 100
  const randsText = rands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const text = rest === 0 ? `R${randsText}` : `R${randsText}.${rest.toString().padStart(2, '0')}`
  return negative ? `-${text}` : text
}
