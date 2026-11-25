import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { acceptOrder, markOrderReady } from '@repo/firebase'
import { formatRand, nextStatusesFor, type Order } from '@repo/types'
import { AppText, Button, Card, Notice, Tag, theme } from '@repo/ui'
import { boardActionError, formatWaiting, isUrgent, itemSummary, minutesSince, stageStartedAt } from '../lib/board'

export interface BoardOrderCardProps {
  order: Order
  now: Date
  /** Opens the decline sheet for this order. */
  onDecline: (order: Order) => void
}

/**
 * One order on the board. Which buttons show comes from the shared status table
 * (`nextStatusesFor`), the same table the security rules enforce, so the app
 * never offers a move the rules would refuse.
 */
export function BoardOrderCard({ order, now, onDecline }: BoardOrderCardProps) {
  const [busy, setBusy] = useState<'accept' | 'ready' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const moves = nextStatusesFor('store_admin', order.status)
  const urgent = isUrgent(order, now)
  const waiting = formatWaiting(minutesSince(stageStartedAt(order), now))
  const { lines, more } = itemSummary(order.items)

  const run = async (action: 'accept' | 'ready') => {
    setBusy(action)
    setError(null)
    try {
      await (action === 'accept' ? acceptOrder(order) : markOrderReady(order))
      // No need to update anything here: the live listener moves the card to its new tab.
    } catch (e) {
      setError(boardActionError(e))
      setBusy(null)
    }
  }

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

      {order.status === 'ready' ? (
        <View style={styles.collect}>
          <AppText variant="small">Collection code: the driver shows you this</AppText>
          <AppText variant="code" style={styles.bigCode} accessibilityLabel={`Collection code ${order.collectionCode.split('').join(' ')}`}>
            {order.collectionCode}
          </AppText>
          <AppText variant="small">
            {order.driverFirstName ? `Driver: ${order.driverFirstName}` : 'No driver assigned yet'}
          </AppText>
        </View>
      ) : null}

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {moves.includes('preparing') || moves.includes('rejected') ? (
        <View style={styles.actions}>
          {moves.includes('rejected') ? (
            <Button
              label="Decline"
              variant="secondary"
              fullWidth={false}
              style={{ flex: 1 }}
              disabled={busy !== null}
              onPress={() => onDecline(order)}
            />
          ) : null}
          {moves.includes('preparing') ? (
            <Button
              label="Accept"
              fullWidth={false}
              style={{ flex: 2 }}
              loading={busy === 'accept'}
              onPress={() => run('accept')}
            />
          ) : null}
        </View>
      ) : null}

      {moves.includes('ready') ? (
        <Button label="Ready for collection" loading={busy === 'ready'} onPress={() => run('ready')} />
      ) : null}
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
  collect: {
    alignItems: 'center',
    gap: theme.space[1],
    padding: theme.space[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfacePage,
  },
  bigCode: { fontSize: theme.text['3xl'], letterSpacing: 8 },
  actions: { flexDirection: 'row', gap: theme.space[3] },
})
