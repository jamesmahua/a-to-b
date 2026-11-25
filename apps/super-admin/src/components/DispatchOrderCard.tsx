import { StyleSheet, View } from 'react-native'
import { ORDER_STATUS_LABELS, formatRand, formatWaiting, minutesSince, type Order } from '@repo/types'
import { AppText, Button, Card, Tag, theme } from '@repo/ui'
import { canAssign, isUrgent, paidAt } from '../lib/dispatch'

const STATUS_COLOURS: Partial<Record<Order['status'], string>> = {
  pending: theme.color.info,
  preparing: theme.color.warning,
  ready: theme.color.success,
  out_for_delivery: theme.color.textMuted,
}

export interface DispatchOrderCardProps {
  order: Order
  now: Date
  /** Opens the assign-driver sheet for this order. */
  onAssign: (order: Order) => void
}

/**
 * One order on the dispatch board: where it's going from and to, how long since
 * it was paid, who's driving, and an Assign / Change driver button.
 */
export function DispatchOrderCard({ order, now, onAssign }: DispatchOrderCardProps) {
  const urgent = isUrgent(order, now)
  const sincePaid = formatWaiting(minutesSince(paidAt(order), now))
  const onTheWay = order.status === 'out_for_delivery'

  return (
    <Card style={urgent ? styles.urgent : undefined}>
      <View style={styles.topRow}>
        <AppText variant="code" style={{ flex: 1 }}>
          {order.code}
        </AppText>
        <Tag label={ORDER_STATUS_LABELS[order.status]} color={STATUS_COLOURS[order.status]} />
      </View>

      <View style={{ gap: 2 }}>
        <AppText variant="label" style={{ fontSize: theme.text.base }}>
          {order.storeName} → {order.deliveryAddress.suburbName}
        </AppText>
        <AppText variant="small">
          Collect: {order.storeAddress.line1}, {order.storeAddress.suburbName}
        </AppText>
        <AppText variant="small">
          For {order.customerFirstName} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
          {formatRand(order.pricing.totalCents)} · paid {sincePaid === 'Just now' ? 'just now' : `${sincePaid} ago`}
        </AppText>
      </View>

      <View style={styles.driverRow}>
        <View style={{ flex: 1 }}>
          {order.driverFirstName ? (
            <AppText>
              {onTheWay ? 'On the way with ' : 'Driver: '}
              <AppText variant="label" style={{ fontSize: theme.text.base }}>
                {order.driverFirstName}
              </AppText>
            </AppText>
          ) : (
            <AppText tone={urgent ? 'danger' : 'muted'}>
              {order.status === 'ready' ? 'Ready at the store, no driver yet' : 'No driver yet'}
            </AppText>
          )}
        </View>
        {canAssign(order) ? (
          <Button
            label={order.driverUid ? 'Change driver' : 'Assign driver'}
            variant={order.driverUid ? 'secondary' : 'primary'}
            fullWidth={false}
            onPress={() => onAssign(order)}
          />
        ) : null}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  urgent: { borderColor: theme.color.danger, borderWidth: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.space[3],
    paddingTop: theme.space[3],
    borderTopWidth: 1,
    borderTopColor: theme.color.borderSubtle,
  },
})
