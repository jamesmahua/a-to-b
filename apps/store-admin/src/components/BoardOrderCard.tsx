import { Pressable, StyleSheet, View } from 'react-native'
import { Link } from 'expo-router'
import { formatRand, type Order } from '@repo/types'
import { AppText, Card, Tag, theme } from '@repo/ui'
import { formatWaiting, isUrgent, itemSummary, minutesSince, stageStartedAt } from '../lib/board'
import { CollectionPanel, OrderActions } from './OrderActions'

export interface BoardOrderCardProps {
  order: Order
  now: Date
  /** Opens the decline sheet for this order. */
  onDecline: (order: Order) => void
}

/** One order on the board: a summary, the right buttons, and a link to the full order. */
export function BoardOrderCard({ order, now, onDecline }: BoardOrderCardProps) {
  const urgent = isUrgent(order, now)
  const waiting = formatWaiting(minutesSince(stageStartedAt(order), now))
  const { lines, more } = itemSummary(order.items)

  return (
    <Card style={urgent ? styles.urgent : undefined}>
      <View style={styles.topRow}>
        <AppText variant="code" style={{ flex: 1 }}>
          {order.code}
        </AppText>
        <Tag
          label={order.status === 'pending' ? `Waiting ${waiting}` : waiting}
          color={urgent ? theme.color.danger : theme.color.textMuted}
          variant={urgent ? 'solid' : 'outline'}
        />
      </View>

      <AppText variant="small">
        For {order.customerFirstName} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
        {formatRand(order.pricing.storeSubtotalCents)} at your prices
      </AppText>

      <View style={{ gap: 2 }}>
        {lines.map((line) => (
          <AppText key={line}>{line}</AppText>
        ))}
        {more > 0 ? <AppText variant="small">+ {more} more</AppText> : null}
      </View>

      {order.customerNote ? (
        <View style={styles.note}>
          <AppText variant="label">Customer note</AppText>
          <AppText>{order.customerNote}</AppText>
        </View>
      ) : null}

      {order.status === 'ready' ? <CollectionPanel order={order} /> : null}

      <OrderActions order={order} onDecline={onDecline} />

      {/* Link + asChild: a real link in the browser (right-click → open in new tab works). */}
      <Link href={`/orders/${order.id}`} asChild>
        <Pressable accessibilityRole="link" style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}>
          <AppText variant="label">View full order →</AppText>
        </Pressable>
      </Link>
    </Card>
  )
}

const styles = StyleSheet.create({
  urgent: { borderColor: theme.color.danger, borderWidth: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  note: {
    gap: 2,
    padding: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfacePage,
  },
  link: { minHeight: 40, justifyContent: 'center', alignSelf: 'center', paddingHorizontal: theme.space[2] },
})
