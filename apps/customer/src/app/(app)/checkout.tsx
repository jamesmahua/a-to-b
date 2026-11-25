import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@repo/firebase'
import { formatRand } from '@repo/types'
import { AppText, Button, Card, Notice, Screen, Stack, TextField, theme } from '@repo/ui'
import { SuburbSheet } from '../../components/SuburbSheet'
import { Row, StoreOrderCard } from '../../components/StoreOrderCard'
import { TopBar, TopBarButton } from '../../components/TopBar'
import { useCart } from '../../lib/cart'
import { checkBasket, placeBasket, type BasketCheck } from '../../lib/checkout'
import { usePricing } from '../../lib/pricing'
import { useSuburb } from '../../lib/suburb'
import { priceCart } from '../../lib/totals'

/**
 * Checkout (needs login: it's inside the (app) folder).
 * 1. Re-check the cart against Firestore  2. Delivery address  3. Totals  4. Demo payment.
 */
export default function Checkout() {
  const router = useRouter()
  const { profile } = useAuth()
  const cart = useCart()
  const { config } = usePricing()
  const { suburb } = useSuburb()

  const [check, setCheck] = useState<BasketCheck | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [notices, setNotices] = useState<string[]>([])
  const [attempt, setAttempt] = useState(0)

  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [instructions, setInstructions] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  // Set once orders are placed, so the now-empty cart doesn't flash "Your cart is empty" before we move on.
  const [done, setDone] = useState(false)
  const [placeErrors, setPlaceErrors] = useState<string[]>([])
  const [pickingSuburb, setPickingSuburb] = useState(false)

  // Step 1: re-check stores and products. Runs on open, when the suburb changes, or on "Try again".
  useEffect(() => {
    if (!cart.loaded || !suburb || cart.groups.length === 0) return
    let cancelled = false
    setCheck(null)
    setCheckError(null)
    checkBasket(cart.groups, suburb)
      .then((result) => {
        if (cancelled) return
        // Fix the cart first (new prices, sold-out items out), then show what changed.
        for (const fix of result.fixes) {
          if (fix.kind === 'remove') cart.removeLine(fix.storeId, fix.productId)
          else cart.updateLine(fix.storeId, fix.productId, { basePriceCents: fix.basePriceCents })
        }
        setNotices(result.fixes.map((f) => f.message))
        setCheck(result)
      })
      .catch(() => !cancelled && setCheckError('We couldn’t check your cart. Check your connection and try again.'))
    return () => {
      cancelled = true
    }
    // Deliberately not re-run on every cart change: the fixes above change the cart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.loaded, suburb?.id, attempt])

  // ── Early states ──
  if (cart.loaded && cart.groups.length === 0 && !placing && !done && placeErrors.length === 0) {
    return (
      <Shell>
        {notices.map((n) => (
          <Notice key={n}>{n}</Notice>
        ))}
        <Card>
          <AppText variant="heading">Your cart is empty</AppText>
          <Button label="Browse stores" onPress={() => router.replace('/')} />
        </Card>
      </Shell>
    )
  }
  if (done) {
    return (
      <Shell>
        <ActivityIndicator color={theme.color.textStrong} />
      </Shell>
    )
  }
  if (!suburb) {
    return (
      <Shell>
        <Card>
          <AppText variant="heading">Where should we deliver?</AppText>
          <Button label="Choose suburb" onPress={() => setPickingSuburb(true)} />
        </Card>
        <SuburbSheet visible={pickingSuburb} onClose={() => setPickingSuburb(false)} />
      </Shell>
    )
  }
  if (checkError) {
    return (
      <Shell>
        <Notice tone="danger">{checkError}</Notice>
        <Button label="Try again" onPress={() => setAttempt((n) => n + 1)} />
      </Shell>
    )
  }
  if (!check || !config || !profile) {
    return (
      <Shell>
        <ActivityIndicator color={theme.color.textStrong} />
        <AppText center variant="small">
          Checking prices and stock…
        </AppText>
      </Shell>
    )
  }

  // ── Main state ──
  // Only stores with no problem can be ordered. The rest stay in the cart.
  const orderable = cart.groups.filter((g) => check.stores[g.store.id] && !check.stores[g.store.id]!.problem)
  const problems = cart.groups
    .map((g) => check.stores[g.store.id]?.problem)
    .filter((p): p is string => !!p)
  const { priced, grandTotalCents } = priceCart(orderable, config)

  async function handlePay() {
    if (!profile || !suburb || !check) return
    setFormError(null)
    setPlaceErrors([])
    if (line1.trim().length < 3) {
      setFormError('Please enter your street address, e.g. 22 Pretoria Rd.')
      return
    }
    setPlacing(true)
    try {
      const { basketId, results } = await placeBasket({
        groups: orderable,
        stores: check.stores,
        customer: { uid: profile.uid, firstName: profile.firstName },
        deliveryAddress: { line1: line1.trim(), line2: line2.trim() || null, suburbId: suburb.id, suburbName: suburb.name },
        deliveryInstructions: instructions.trim() || null,
      })
      // Take the stores that worked out of the cart; failed ones stay so they can try again.
      for (const r of results) if (r.orderId) cart.removeStore(r.storeId)
      const failed = results.filter((r) => r.error).map((r) => r.error!)
      if (results.some((r) => r.orderId)) {
        setDone(true)
        router.replace(`/orders/${basketId}`)
      } else {
        setPlaceErrors(failed.length ? failed : ['Nothing could be ordered. Please try again.'])
      }
    } finally {
      setPlacing(false)
    }
  }

  return (
    <Shell>
      {notices.map((n) => (
        <Notice key={n}>{n}</Notice>
      ))}
      {problems.map((p) => (
        <Notice key={p} tone="danger">
          {p} Its items stay in your cart for later.
        </Notice>
      ))}
      {placeErrors.map((p) => (
        <Notice key={p} tone="danger">
          {p}
        </Notice>
      ))}

      <Card>
        <AppText variant="heading">Deliver to</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText style={{ flex: 1 }}>{suburb.name}</AppText>
          <TopBarButton label="Change" accessibilityLabel="Change suburb" onPress={() => setPickingSuburb(true)} />
        </View>
        <TextField label="Street address" placeholder="e.g. 22 Pretoria Rd" value={line1} onChangeText={setLine1} autoComplete="street-address" error={formError} />
        <TextField label="Complex, unit or building (optional)" value={line2} onChangeText={setLine2} />
        <TextField
          label="Notes for the driver (optional)"
          placeholder="e.g. Blue gate, ring twice"
          value={instructions}
          onChangeText={setInstructions}
          maxLength={200}
        />
      </Card>

      {priced.map(({ group, pricing }) => (
        <StoreOrderCard key={group.store.id} group={group} pricing={pricing} />
      ))}

      {priced.length > 0 ? (
        <Stack gap={3}>
          {priced.length > 1 ? (
            <Card>
              <Row label="Total to pay" value={grandTotalCents} strong />
            </Card>
          ) : null}
          <Notice>Demo payment: no money changes hands. Real payments (Peach Payments) come later.</Notice>
          <Button label={`Pay ${formatRand(grandTotalCents)} (demo)`} onPress={handlePay} loading={placing} />
        </Stack>
      ) : (
        <Button label="Back to cart" variant="secondary" onPress={() => router.replace('/cart')} />
      )}
      <SuburbSheet visible={pickingSuburb} onClose={() => setPickingSuburb(false)} />
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar back title="Checkout" />
      <Screen>{children}</Screen>
    </View>
  )
}
