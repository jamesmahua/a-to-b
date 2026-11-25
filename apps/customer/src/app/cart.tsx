import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { formatRand } from '@repo/types'
import { AppText, Button, Card, Notice, Screen, Stack, theme } from '@repo/ui'
import { Row, StoreOrderCard } from '../components/StoreOrderCard'
import { TopBar } from '../components/TopBar'
import { useCart } from '../lib/cart'
import { usePricing } from '../lib/pricing'
import { priceCart } from '../lib/totals'

/** The cart, grouped by store, with every fee shown. Works before logging in; checkout asks to log in. */
export default function CartScreen() {
  const router = useRouter()
  const cart = useCart()
  const { config, error } = usePricing()

  if (!cart.loaded || (!config && !error)) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar back title="Your cart" />
        <Screen centered>
          <ActivityIndicator color={theme.color.textStrong} />
        </Screen>
      </View>
    )
  }

  if (cart.groups.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar back title="Your cart" />
        <Screen>
          <Card>
            <AppText variant="heading">Your cart is empty</AppText>
            <AppText>Find a store near you and add something nice.</AppText>
            <Button label="Browse stores" onPress={() => router.replace('/')} />
          </Card>
        </Screen>
      </View>
    )
  }

  if (!config) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar back title="Your cart" />
        <Screen>
          <Notice tone="danger">{error}</Notice>
        </Screen>
      </View>
    )
  }

  const { priced, grandTotalCents } = priceCart(cart.groups, config)
  const several = priced.length > 1

  return (
    <View style={{ flex: 1 }}>
      <TopBar back title="Your cart" />
      <Screen>
        {several ? (
          <Notice>
            You’re ordering from {priced.length} stores. Each store packs and delivers its own order, so each has its own
            service and delivery fee.
          </Notice>
        ) : null}

        {priced.map(({ group, pricing }) => (
          <Stack key={group.store.id} gap={2}>
            <StoreOrderCard group={group} pricing={pricing} editable />
            <Button label={`Remove ${group.store.name}`} variant="ghost" onPress={() => cart.removeStore(group.store.id)} />
          </Stack>
        ))}

        {several ? (
          <Card>
            <Row label="Total to pay" value={grandTotalCents} strong />
          </Card>
        ) : null}

        <Button label={`Checkout · ${formatRand(grandTotalCents)}`} onPress={() => router.push('/checkout')} />
        <AppText variant="small" center>
          No hidden fees. What you see here is what you pay.
        </AppText>
      </Screen>
    </View>
  )
}
