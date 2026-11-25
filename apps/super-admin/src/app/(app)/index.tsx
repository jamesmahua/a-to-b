import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { watchApprovedDrivers, watchOrdersByStatus } from '@repo/firebase'
import type { Driver, Order } from '@repo/types'
import { AppText, Card, ChipTabs, Notice, Screen, theme } from '@repo/ui'
import { AdminHeader } from '../../components/AdminHeader'
import { AssignDriverSheet } from '../../components/AssignDriverSheet'
import { DispatchOrderCard } from '../../components/DispatchOrderCard'
import { DISPATCH_STATUSES, DISPATCH_TABS, freeDriverCount, groupDispatch, isUrgent, type DispatchTab } from '../../lib/dispatch'
import { useNow } from '../../lib/hooks'

const MAX_ORDERS = 100

const EMPTY_TEXT: Record<DispatchTab, string> = {
  needs_driver: 'Every open order has a driver. New orders appear here by themselves once they’re paid.',
  assigned: 'No orders waiting with a driver assigned.',
  on_the_way: 'Nobody is out delivering right now.',
}

/**
 * Dispatch board: the super admin's home screen (/admin in the browser).
 * v1 dispatch is manual (spec §9): every paid order lands here, and an admin
 * picks a driver. Two live listeners: open orders, and approved drivers.
 */
export default function DispatchBoard() {
  const now = useNow()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<DispatchTab>('needs_driver')
  const [assigningId, setAssigningId] = useState<string | null>(null)

  useEffect(
    () =>
      watchOrdersByStatus(
        DISPATCH_STATUSES,
        setOrders,
        () => setLoadError('We couldn’t load orders. Check your connection.'),
        MAX_ORDERS,
      ),
    [],
  )
  useEffect(
    () => watchApprovedDrivers(setDrivers, () => setLoadError('We couldn’t load drivers. Check your connection.')),
    [],
  )

  const groups = useMemo(() => groupDispatch(orders ?? [], now), [orders, now])
  const freeDrivers = useMemo(() => freeDriverCount(drivers, orders ?? []), [drivers, orders])
  const urgentCount = groups.needs_driver.filter((o) => isUrgent(o, now)).length

  // Always hand the sheet the live version of the order, so it never acts on old data.
  const assigning = assigningId ? ((orders ?? []).find((o) => o.id === assigningId) ?? null) : null
  // If the order leaves the board (e.g. cancelled) while the sheet is open, close it.
  useEffect(() => {
    if (assigningId && orders && !assigning) setAssigningId(null)
  }, [assigningId, orders, assigning])

  const summary = orders
    ? `${groups.needs_driver.length} need a driver · ${freeDrivers} ${freeDrivers === 1 ? 'driver' : 'drivers'} free`
    : undefined
  const list = groups[tab]

  return (
    <View style={{ flex: 1 }}>
      <AdminHeader title="Dispatch" summary={summary} />
      <Screen maxWidth={720}>
        <ChipTabs
          accessibilityLabel="Dispatch stages"
          options={DISPATCH_TABS.map((t) => ({
            value: t.value,
            label: groups[t.value].length > 0 ? `${t.label} (${groups[t.value].length})` : t.label,
          }))}
          value={tab}
          onChange={setTab}
        />

        {loadError ? <Notice tone="danger">{loadError}</Notice> : null}
        {urgentCount > 0 && tab !== 'needs_driver' ? (
          <Notice tone="danger">
            {urgentCount} {urgentCount === 1 ? 'order is' : 'orders are'} waiting too long for a driver. See “Needs a driver”.
          </Notice>
        ) : null}
        {!orders && !loadError ? <ActivityIndicator color={theme.color.textStrong} /> : null}

        {orders && list.length === 0 ? (
          <Card>
            <AppText>{EMPTY_TEXT[tab]}</AppText>
          </Card>
        ) : null}

        {list.map((order) => (
          <DispatchOrderCard key={order.id} order={order} now={now} onAssign={(o) => setAssigningId(o.id)} />
        ))}

        {orders && orders.length >= MAX_ORDERS ? (
          <AppText variant="small" center>
            Showing the {MAX_ORDERS} newest open orders.
          </AppText>
        ) : null}
      </Screen>

      <AssignDriverSheet
        order={assigning}
        drivers={drivers}
        openOrders={orders ?? []}
        onClose={() => setAssigningId(null)}
      />
    </View>
  )
}
