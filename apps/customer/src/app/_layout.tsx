import type { ReactNode } from 'react'
import { RootLayout } from '@repo/app-shell'
import { CartProvider } from '../lib/cart'
import { PricingProvider } from '../lib/pricing'
import { SuburbProvider } from '../lib/suburb'

/**
 * App-wide state for the customer app. These sit inside the login provider,
 * so they can use `useAuth()`, and every screen can use `useCart()` etc.
 */
function CustomerProviders({ children }: { children: ReactNode }) {
  return (
    <PricingProvider>
      <SuburbProvider>
        <CartProvider>{children}</CartProvider>
      </SuburbProvider>
    </PricingProvider>
  )
}

/**
 * Routes (Expo Router: each file in src/app is a screen):
 *   /                  index.tsx            Home: suburb, vertical filter, stores    (public)
 *   /stores/:id        stores/[storeId].tsx Store page + product sheet               (public)
 *   /search            search.tsx           Product search                           (public)
 *   /cart              cart.tsx             Cart, grouped by store                   (public)
 *   /checkout          (app)/checkout.tsx   Address, totals, demo payment            (login)
 *   /orders/:basketId  (app)/orders/…       "Order placed" + live status             (login)
 * Folders in (brackets) don't appear in the URL; (app)/_layout.tsx requires login.
 */
export default function Layout() {
  return <RootLayout appRole="customer" Providers={CustomerProviders} />
}
