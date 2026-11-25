import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth, watchCustomerOrders } from '@repo/firebase'
import type { Order } from '@repo/types'
import { AppText, Button, Card, Notice, Screen, Stack, theme } from '@repo/ui'
import { OrderCard } from '../../../components/OrderCard'
import { TopBar } from '../../../components/TopBar'

/**
 * "Order placed": every order from one checkout (same basketId), with its
 * status updating live as the store accepts and prepares it.
 * Each card (OrderCard) opens that order's tracking page: /track/<orderId>.
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
              <OrderCard key={o.id} order={o} />
            ))}
          </>
        ) : null}

        {orders && orders.length === 0 ? (
          <Card>
            <AppText variant="heading">We can’t find this order</AppText>
            <AppText>It may belong to a different account.</AppText>
          </Card>
        ) : null}

        <Button label="My orders" variant="secondary" onPress={() => router.replace('/orders')} />
        <Button label="Keep shopping" variant="ghost" onPress={() => router.replace('/')} />
      </Screen>
    </View>
  )
}
