/**
 * Today's fees, loaded once from `config/pricing` and shared with every screen.
 *
 * Products only store the store's own price. Every price a customer sees goes
 * through `unitPrice()`, which adds the markup from this config. If the revenue
 * model changes (spec §12.1), the screens don't change: only the config does.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getPricingConfig } from '@repo/firebase'
import { getCustomerUnitPrice, type Cents, type PricingConfig } from '@repo/types'

interface PricingContextValue {
  config: PricingConfig | null
  error: string | null
  /** What the customer pays per unit. Only call once `config` is loaded. */
  unitPrice: (basePriceCents: Cents) => Cents
}

const PricingContext = createContext<PricingContextValue | null>(null)

export function PricingProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getPricingConfig()
      .then((c) => !cancelled && setConfig(c))
      .catch(() => !cancelled && setError('We couldn’t load prices. Check your connection and try again.'))
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<PricingContextValue>(
    () => ({
      config,
      error,
      unitPrice: (base) => (config ? getCustomerUnitPrice(base, config) : base),
    }),
    [config, error],
  )

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>
}

export function usePricing(): PricingContextValue {
  const ctx = useContext(PricingContext)
  if (!ctx) throw new Error('usePricing must be used inside <PricingProvider>')
  return ctx
}
