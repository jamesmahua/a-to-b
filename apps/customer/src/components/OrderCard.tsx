import { Pressable, View } from 'react-native'
import { Link } from 'expo-router'
import { formatRand, type Order } from '@repo/types'
import { AppText, Card, Tag, theme } from '@repo/ui'
import { CUSTOMER_STATUS_LABELS } from '../lib/tracking'

/** "25 Nov, 21:10" */
export function formatOrderTime(order: Pick<Order, 'timestamps'>): string {
  const d = order.timestamps.createdAt?.toDate?.()
  if (!d) return ''
  return `${d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
}

/**
 * One order as a tappable card that opens its tracking page.
 * Used on "Order placed" and "My orders", so both look and behave the same.
 */
export function OrderCard({ order, showDate }: { order: Order; showDate?: boolean }) {
  const ended = order.status === 'rejected' || order.status === 'cancelled'
  return (
    // Link + asChild: the whole card is the link (a real <a> in the browser).
    <Link href={`/track/${order.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Track order ${order.code} from ${order.storeName}, ${CUSTOMER_STATUS_LABELS[order.status]}`}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
            <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
              {order.storeName}
            </AppText>
            <Tag
              label={CUSTOMER_STATUS_LABELS[order.status]}
              color={ended ? theme.color.textMuted : theme.color.vertical[order.storeVertical]}
              variant={ended ? 'solid' : 'outline'}
            />
          </View>
          <AppText variant="code">{order.code}</AppText>
          <AppText variant="small">
            {showDate ? `${formatOrderTime(order)} · ` : ''}
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} · {formatRand(order.pricing.totalCents)}
            {showDate ? '' : ` · to ${order.deliveryAddress.line1}, ${order.deliveryAddress.suburbName}`}
          </AppText>
          <AppText variant="label">Track this order →</AppText>
        </Card>
      </Pressable>
    </Link>
  )
}
