import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { rejectOrder, signOut, watchStoreOrders } from '@repo/firebase'
import type { Order, RejectReason } from '@repo/types'
import { AppText, Button, Card, ChipTabs, Notice, Screen, theme } from '@repo/ui'
import { BoardHeader } from '../../components/BoardHeader'
import { BoardOrderCard } from '../../components/BoardOrderCard'
import { DeclineSheet } from '../../components/DeclineSheet'
import { BOARD_STATUSES, BOARD_TABS, boardActionError, groupByTab, tabLabel, type BoardTab } from '../../lib/board'
import { useMyStore, useNow } from '../../lib/hooks'

const EMPTY_TEXT: Record<BoardTab, string> = {
  new: 'No new orders right now. Keep this page open: new orders appear here by themselves.',
  preparing: 'Nothing being prepared. Accept a new order to start.',
  ready: 'Nothing waiting for a driver.',
}

/**
 * The live orders board: the store admin's home screen (/store in the browser).
 * One real-time listener brings in every open order; the tabs just filter it.
 */
export default function OrdersBoard() {
  const myStore = useMyStore()
  const storeId = myStore.status === 'ready' ? myStore.store.id : null
  const now = useNow()

  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<BoardTab>('new')
  const [declining, setDeclining] = useState<Order | null>(null)
  const [declineError, setDeclineError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) return
    setOrders(null)
    setLoadError(null)
    // Returning the unsubscribe function stops the listener when the screen closes.
    return watchStoreOrders(storeId, BOARD_STATUSES, setOrders, () =>
      setLoadError('We couldn’t load your orders. Check your connection.'),
    )
  }, [storeId])

  const groups = useMemo(() => groupByTab(orders ?? []), [orders])

  const confirmDecline = async (reason: RejectReason) => {
    if (!declining) return
    try {
      await rejectOrder(declining, reason)
      setDeclining(null)
    } catch (e) {
      setDeclining(null)
      setDeclineError(boardActionError(e))
    }
  }

  // ── Before the store has loaded ──
  if (myStore.status !== 'ready') {
    return (
      <Screen centered maxWidth={480}>
        {myStore.status === 'loading' ? <ActivityIndicator color={theme.color.textStrong} /> : null}
        {myStore.status === 'no_store' ? (
          <Card>
            <AppText variant="heading">No store linked yet</AppText>
            <AppText>
              Your account isn’t connected to a store. Once Klick&Kolleka has set up your store, your orders will show here.
            </AppText>
            <Button label="Log out" variant="secondary" onPress={() => signOut()} />
          </Card>
        ) : null}
        {myStore.status === 'error' ? (
          <Notice tone="danger">We couldn’t load your store. Check your connection and refresh.</Notice>
        ) : null}
      </Screen>
    )
  }

  const { store } = myStore
  const list = groups[tab]

  return (
    <View style={{ flex: 1 }}>
      <BoardHeader storeName={store.name} tradingStatus={store.tradingStatus} />
      <Screen maxWidth={640}>
        {store.approval !== 'approved' ? (
          <Notice tone="info">
            Your store is waiting for approval from Klick&Kolleka. Customers can’t see it yet.
          </Notice>
        ) : null}
        {store.approval === 'approved' && store.tradingStatus !== 'open' ? (
          <Notice tone="info">
            Your store is {store.tradingStatus}, so customers can’t place new orders. Orders already placed still show here.
          </Notice>
        ) : null}

        <ChipTabs
          accessibilityLabel="Order stages"
          options={BOARD_TABS.map((t) => ({ value: t.value, label: tabLabel(t.label, groups[t.value].length) }))}
          value={tab}
          onChange={setTab}
        />

        {loadError ? <Notice tone="danger">{loadError}</Notice> : null}
        {declineError ? <Notice tone="danger">{declineError}</Notice> : null}
        {!orders && !loadError ? <ActivityIndicator color={theme.color.textStrong} /> : null}

        {orders && list.length === 0 ? (
          <Card>
            <AppText>{EMPTY_TEXT[tab]}</AppText>
          </Card>
        ) : null}

        {list.map((order) => (
          <BoardOrderCard
            key={order.id}
            order={order}
            now={now}
            onDecline={(o) => {
              setDeclineError(null)
              setDeclining(o)
            }}
          />
        ))}

        {orders && orders.length >= 50 ? (
          <AppText variant="small" center>
            Showing the 50 newest open orders.
          </AppText>
        ) : null}
      </Screen>

      <DeclineSheet orderCode={declining?.code ?? null} onClose={() => setDeclining(null)} onConfirm={confirmDecline} />
    </View>
  )
}
