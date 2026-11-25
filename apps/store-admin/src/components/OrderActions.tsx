import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { acceptOrder, markOrderReady } from '@repo/firebase'
import { nextStatusesFor, type Order } from '@repo/types'
import { AppText, Button, Notice, theme } from '@repo/ui'
import { boardActionError } from '../lib/board'

/**
 * Accept / Decline / Ready for collection, for one order. Used on the board
 * card and on the order detail screen, so both behave the same.
 *
 * Which buttons show comes from the shared status table (`nextStatusesFor`),
 * the same table the security rules enforce.
 */
export function OrderActions({ order, onDecline }: { order: Order; onDecline: (order: Order) => void }) {
  const [busy, setBusy] = useState<'accept' | 'ready' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const moves = nextStatusesFor('store_admin', order.status)

  const run = async (action: 'accept' | 'ready') => {
    setBusy(action)
    setError(null)
    try {
      await (action === 'accept' ? acceptOrder(order) : markOrderReady(order))
      // The live listener brings in the new status; nothing else to update here.
    } catch (e) {
      setError(boardActionError(e))
    } finally {
      setBusy(null)
    }
  }

  if (moves.length === 0) return null

  return (
    <View style={{ gap: theme.space[3] }}>
      {error ? <Notice tone="danger">{error}</Notice> : null}

      {moves.includes('preparing') || moves.includes('rejected') ? (
        <View style={styles.row}>
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
            <Button label="Accept" fullWidth={false} style={{ flex: 2 }} loading={busy === 'accept'} onPress={() => run('accept')} />
          ) : null}
        </View>
      ) : null}

      {moves.includes('ready') ? (
        <Button label="Ready for collection" loading={busy === 'ready'} onPress={() => run('ready')} />
      ) : null}
    </View>
  )
}

/** The 4-digit code the driver shows at pickup, plus who's coming. */
export function CollectionPanel({ order }: { order: Pick<Order, 'collectionCode' | 'driverFirstName'> }) {
  return (
    <View style={styles.collect}>
      <AppText variant="small">Collection code: the driver shows you this</AppText>
      <AppText
        variant="code"
        style={styles.bigCode}
        accessibilityLabel={`Collection code ${order.collectionCode.split('').join(' ')}`}
      >
        {order.collectionCode}
      </AppText>
      <AppText variant="small">{order.driverFirstName ? `Driver: ${order.driverFirstName}` : 'No driver assigned yet'}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.space[3] },
  collect: {
    alignItems: 'center',
    gap: theme.space[1],
    padding: theme.space[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfacePage,
  },
  bigCode: { fontSize: theme.text['3xl'], letterSpacing: 8 },
})
