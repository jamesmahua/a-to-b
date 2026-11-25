import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { rejectOrder, watchOrder } from '@repo/firebase'
import { TERMINAL_STATUSES, formatRand, type Order, type RejectReason } from '@repo/types'
import { AppText, Card, Notice, Screen, Tag, theme } from '@repo/ui'
import { DeclineSheet } from '../../../components/DeclineSheet'
import { CollectionPanel, OrderActions } from '../../../components/OrderActions'
import { ScreenHeader } from '../../../components/ScreenHeader'
import { boardActionError, minutesSince, stageStartedAt } from '../../../lib/board'
import { useNow } from '../../../lib/hooks'
import { STORE_STATUS_LABELS, formatClock, payoutRows, stageText, storeLines, storeTimeline } from '../../../lib/order-detail'

/**
 * One order in full, live. URL: /orders/<orderId>
 * Same buttons as the board card, so the store can act from here too.
 * Once the order leaves the board (collected, declined, cancelled) this screen
 * still works, which is what the history list (step 5) will link to.
 */
export default function OrderDetail() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>()
  const now = useNow()
  // undefined = loading · null = not found (or not this store's) · Order = loaded
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [declining, setDeclining] = useState(false)

  useEffect(() => {
    if (!orderId) return
    return watchOrder(orderId, setOrder, (err) => {
      // The rules only let a store read its own orders, so another store's order looks "not found".
      if ((err as { code?: string }).code === 'permission-denied') setOrder(null)
      else setError('We lost the connection. We’ll keep trying; check your data or Wi-Fi.')
    })
  }, [orderId])

  const confirmDecline = async (reason: RejectReason) => {
    if (!order) return
    try {
      await rejectOrder(order, reason)
    } catch (e) {
      setError(boardActionError(e))
    } finally {
      setDeclining(false)
    }
  }

  if (order === undefined && !error) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Order" />
        <Screen maxWidth={640}>
          <ActivityIndicator color={theme.color.textStrong} />
        </Screen>
      </View>
    )
  }

  if (!order) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title="Order" />
        <Screen maxWidth={640}>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Card>
            <AppText variant="heading">We can’t find this order</AppText>
            <AppText>It may belong to another store, or the link is wrong.</AppText>
          </Card>
        </Screen>
      </View>
    )
  }

  const ended = TERMINAL_STATUSES.includes(order.status)
  const stage = stageText(order.status, minutesSince(stageStartedAt(order), now))
  const timeline = storeTimeline(order)

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={order.code} />
      <Screen maxWidth={640}>
        {error ? <Notice tone="danger">{error}</Notice> : null}

        {/* Status + who it's for */}
        <Card>
          <View style={styles.row}>
            <AppText variant="code" style={{ flex: 1 }}>
              {order.code}
            </AppText>
            <Tag
              label={STORE_STATUS_LABELS[order.status]}
              color={ended ? theme.color.textMuted : theme.color.textStrong}
              variant={ended ? 'solid' : 'outline'}
            />
          </View>
          <AppText>
            For {order.customerFirstName} · delivering to {order.deliveryAddress.suburbName}
          </AppText>
          {stage ? <AppText variant="small">{stage}</AppText> : null}
          {order.status === 'ready' ? <CollectionPanel order={order} /> : null}
          <OrderActions order={order} onDecline={() => setDeclining(true)} />
        </Card>

        {/* Customer note: shown before the items so it isn't missed while packing */}
        {order.customerNote ? (
          <Card>
            <AppText variant="heading">Customer note</AppText>
            <AppText>{order.customerNote}</AppText>
          </Card>
        ) : null}

        {/* Items at the store's own prices */}
        <Card>
          <AppText variant="heading">
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </AppText>
          {storeLines(order).map((line) => (
            <View key={line.key} style={styles.itemRow}>
              <AppText style={styles.qty}>{line.quantity} ×</AppText>
              <View style={{ flex: 1 }}>
                <AppText>{line.name}</AppText>
                {line.quantity > 1 ? <AppText variant="small">{formatRand(line.unitCents)} each</AppText> : null}
              </View>
              <AppText>{formatRand(line.lineCents)}</AppText>
            </View>
          ))}
          <View style={styles.divider} />
          {payoutRows(order.pricing).map((row) => (
            <View key={row.label} style={styles.row}>
              <AppText variant={row.total ? 'heading' : 'body'} style={{ flex: 1 }}>
                {row.label}
              </AppText>
              <AppText variant={row.total ? 'heading' : 'body'}>
                {row.deduction ? '−' : ''}
                {formatRand(row.cents)}
              </AppText>
            </View>
          ))}
        </Card>

        {/* History with times */}
        <Card>
          <AppText variant="heading">Timeline</AppText>
          {timeline.map((step) => (
            <View key={step.label} style={styles.row}>
              <View style={[styles.dot, step.done && styles.dotDone]} />
              <AppText style={{ flex: 1 }} tone={step.done ? 'default' : 'muted'}>
                {step.label}
              </AppText>
              <AppText variant="small">{step.at ? formatClock(step.at, now) : ''}</AppText>
            </View>
          ))}
        </Card>
      </Screen>

      <DeclineSheet orderCode={declining ? order.code : null} onClose={() => setDeclining(false)} onConfirm={confirmDecline} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space[3] },
  qty: { minWidth: 32, fontWeight: theme.weight.semibold },
  divider: { height: 1, backgroundColor: theme.color.borderSubtle },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: theme.color.borderStrong },
  dotDone: { backgroundColor: theme.color.textStrong, borderColor: theme.color.textStrong },
})
