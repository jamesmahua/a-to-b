import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth, watchCustomerOrders } from '@repo/firebase'
import { ORDER_STATUS_LABELS, formatRand, type Order } from '@repo/types'
import { AppText, Button, Card, Notice, Screen, Stack, Tag, theme } from '@repo/ui'
import { TopBar } from '../../../components/TopBar'

/**
 * "Order placed": every order from one checkout (same basketId), with its
 * status updating live as the store accepts and prepares it.
 * Tapping an order opens its full tracking page: /track/<orderId>.
 */
export default function OrdersPlaced() {
  const { basketId } = useLocalSearchParams<{ basketId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    // Reuses the customer's live order list (latest 20) and keeps this basket's orders.
    return watchCustomerOrders(
      user.uid,
      (all) => setOrders(all.filter((o) => o.basketId === basketId)),
      () => setError('We couldn’t load your order. Check your connection.'),
    )
  }, [user, basketId])

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Order placed" />
      <Screen>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {!orders && !error ? <ActivityIndicator color={theme.color.textStrong} /> : null}

        {orders && orders.length > 0 ? (
          <>
            <Stack gap={1}>
              <AppText variant="title">Sharp, it’s on its way! 🎉</AppText>
              <AppText>We’ve sent your order to {orders.length === 1 ? 'the store' : `${orders.length} stores`}. This page updates by itself.</AppText>
            </Stack>
            {orders.map((o) => (
              // Link + asChild: the whole card is the link (a real <a> in the browser).
              // The key moves to Link because it's now the outermost element in the list.
              <Link key={o.id} href={`/track/${o.id}`} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Track order ${o.code} from ${o.storeName}`}
                  style={({ pressed }) => pressed && { opacity: 0.85 }}
                >
                  <Card>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
                      <AppText variant="heading" style={{ flex: 1 }}>
                        {o.storeName}
                      </AppText>
                      <Tag label={ORDER_STATUS_LABELS[o.status]} color={theme.color.vertical[o.storeVertical]} />
                    </View>
                    <AppText variant="code">{o.code}</AppText>
                    <AppText variant="small">
                      {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'} · {formatRand(o.pricing.totalCents)} · to {o.deliveryAddress.line1},{' '}
                      {o.deliveryAddress.suburbName}
                    </AppText>
                    <AppText variant="label">Track this order →</AppText>
                  </Card>
                </Pressable>
              </Link>
            ))}
          </>
        ) : null}

        {orders && orders.length === 0 ? (
          <Card>
            <AppText variant="heading">We can’t find this order</AppText>
            <AppText>It may belong to a different account.</AppText>
          </Card>
        ) : null}

        <Button label="Keep shopping" variant="secondary" onPress={() => router.replace('/')} />
      </Screen>
    </View>
  )
}
