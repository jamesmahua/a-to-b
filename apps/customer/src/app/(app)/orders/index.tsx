import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth, watchCustomerOrders } from '@repo/firebase'
import { TERMINAL_STATUSES, type Order } from '@repo/types'
import { AppText, Button, Card, Notice, Screen, theme } from '@repo/ui'
import { OrderCard } from '../../../components/OrderCard'
import { TopBar } from '../../../components/TopBar'

/**
 * "My orders": /orders. Live, newest first, split into orders still in progress
 * and past ones. `index.tsx` in a folder is that folder's own URL, so this is
 * /orders while [basketId].tsx next to it is /orders/<basketId>.
 */
export default function MyOrders() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    return watchCustomerOrders(user.uid, setOrders, () => setError('We couldn’t load your orders. Check your connection.'))
  }, [user])

  // TERMINAL_STATUSES = delivered, rejected, cancelled: nothing more will happen to those.
  const active = (orders ?? []).filter((o) => !TERMINAL_STATUSES.includes(o.status))
  const past = (orders ?? []).filter((o) => TERMINAL_STATUSES.includes(o.status))

  return (
    <View style={{ flex: 1 }}>
      <TopBar back title="My orders" />
      <Screen>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {!orders && !error ? <ActivityIndicator color={theme.color.textStrong} /> : null}

        {orders && orders.length === 0 ? (
          <Card>
            <AppText variant="heading">No orders yet</AppText>
            <AppText>When you order something, you can follow it here.</AppText>
            <Button label="Browse stores" onPress={() => router.replace('/')} />
          </Card>
        ) : null}

        {active.length > 0 ? <AppText variant="heading">In progress</AppText> : null}
        {active.map((o) => (
          <OrderCard key={o.id} order={o} showDate />
        ))}

        {past.length > 0 ? <AppText variant="heading">Past orders</AppText> : null}
        {past.map((o) => (
          <OrderCard key={o.id} order={o} showDate />
        ))}

        {orders && orders.length >= 20 ? (
          <AppText variant="small" center>
            Showing your latest 20 orders.
          </AppText>
        ) : null}
      </Screen>
    </View>
  )
}
