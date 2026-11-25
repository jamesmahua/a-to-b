import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { cancelOrderAsCustomer, watchOrder } from '@repo/firebase'
import { formatRand, type Order } from '@repo/types'
import { AppText, Button, Card, Notice, Screen, Sheet, Stack, theme } from '@repo/ui'
import { Row } from '../../../components/StoreOrderCard'
import { TopBar } from '../../../components/TopBar'
import { TrackingTimeline } from '../../../components/TrackingTimeline'
import { customerCanCancel, getTracking } from '../../../lib/tracking'

/**
 * Tracking for one order, live. URL: /track/<orderId>
 *
 * The flow is: watchOrder() → setOrder() → getTracking(order) → draw it.
 * Whenever the store or driver moves the order on, Firestore pushes the new
 * order here and the screen redraws by itself. No refresh button needed.
 */
export default function TrackOrder() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  // undefined = still loading · null = not found (or not theirs) · Order = loaded
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  // Cancel flow: confirm sheet open? request in flight? error from Firestore?
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    // watchOrder returns an "unsubscribe" function; returning it stops the listener when the screen closes.
    return watchOrder(orderId, setOrder, (err) => {
      // The rules only let customers read their own orders, so someone else's order looks "not found".
      if ((err as { code?: string }).code === 'permission-denied') setOrder(null)
      else setError('We lost the connection. We’ll keep trying; check your data or Wi-Fi.')
    })
  }, [orderId])

  if (order === undefined && !error) {
    return (
      <Shell title="Your order">
        <ActivityIndicator color={theme.color.textStrong} />
      </Shell>
    )
  }

  if (!order) {
    return (
      <Shell title="Your order">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Card>
          <AppText variant="heading">We can’t find this order</AppText>
          <AppText>It may belong to a different account, or the link is wrong.</AppText>
        </Card>
      </Shell>
    )
  }

  const tracking = getTracking(order)
  const canCancel = customerCanCancel(order.status)

  async function handleCancel() {
    if (!order) return
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelOrderAsCustomer(order, 'Cancelled by customer')
      setConfirming(false) // the live listener redraws the page as "Order cancelled"
    } catch {
      // Most likely the store accepted it a moment ago: the rules no longer allow the customer to cancel.
      setCancelError('We couldn’t cancel this order. The store may have just accepted it. Check the status above.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Shell title={order.code}>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <Stack gap={1}>
        <AppText variant="title" style={tracking.problem ? { color: theme.color.danger } : undefined}>
          {tracking.headline}
        </AppText>
        {tracking.detail ? <AppText>{tracking.detail}</AppText> : null}
      </Stack>

      <Card>
        <TrackingTimeline steps={tracking.steps} />
      </Card>

      <Card>
        <AppText variant="heading">{order.storeName}</AppText>
        {order.items.map((item) => (
          <View key={item.productId} style={{ flexDirection: 'row' }}>
            <AppText style={{ flex: 1 }}>
              {item.quantity} × {item.name}
            </AppText>
            <AppText>{formatRand(item.lineTotalCents)}</AppText>
          </View>
        ))}
        {/* These come from the order's saved money snapshot, so they never change after checkout. */}
        <Row label="Service fee" value={order.pricing.serviceFeeCents} />
        <Row label="Delivery fee" value={order.pricing.deliveryFeeCents} />
        <Row label="Total paid" value={order.pricing.totalCents} strong />
      </Card>

      <Card>
        <AppText variant="heading">Delivering to</AppText>
        <AppText>
          {order.deliveryAddress.line1}
          {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}, {order.deliveryAddress.suburbName}
        </AppText>
        {order.deliveryInstructions ? <AppText variant="small">Note: {order.deliveryInstructions}</AppText> : null}
      </Card>

      {/* Only while the store hasn't accepted. Same rule as firestore.rules (ORDER_TRANSITIONS). */}
      {canCancel ? <Button label="Cancel order" variant="ghost" onPress={() => setConfirming(true)} /> : null}

      {/* A sheet instead of a browser confirm() popup: looks the same on phone and web, and is accessible. */}
      <Sheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        title="Cancel this order?"
        footer={
          <Stack gap={2}>
            <Button label="Yes, cancel it" variant="danger" onPress={handleCancel} loading={cancelling} />
            <Button label="Keep my order" variant="ghost" onPress={() => setConfirming(false)} />
          </Stack>
        }
      >
        <AppText>
          {order.storeName} hasn’t started on it yet, so you can still cancel {order.code}.
        </AppText>
        {order.payment.provider === 'demo' ? (
          <AppText variant="small">Demo payment: no money was taken, so there’s nothing to refund.</AppText>
        ) : null}
        {cancelError ? <Notice tone="danger">{cancelError}</Notice> : null}
      </Sheet>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar back title={title} />
      <Screen>{children}</Screen>
    </View>
  )
}
