import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { assignDriver } from '@repo/firebase'
import type { Driver, Order, VehicleType } from '@repo/types'
import { AppText, Button, Notice, Sheet, Tag, theme } from '@repo/ui'
import { dispatchError, driverOptions, type DriverOption } from '../lib/dispatch'

const VEHICLE_LABELS: Record<VehicleType, string> = {
  motorbike: 'Motorbike',
  car: 'Car',
  scooter: 'Scooter',
  bicycle: 'Bicycle',
}

export interface AssignDriverSheetProps {
  /** The order being dispatched. `null` keeps the sheet closed. */
  order: Order | null
  drivers: Driver[]
  /** The board's live list, used to tell who's really busy. */
  openOrders: Order[]
  onClose: () => void
}

/**
 * "Who's taking KK-4821?" Lists approved drivers, free ones first (those who
 * cover the area on top). Busy and offline drivers are hidden behind a toggle
 * and can't be picked: v1 is one job per driver.
 */
export function AssignDriverSheet({ order, drivers, openOrders, onClose }: AssignDriverSheetProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start fresh each time the sheet opens for an order.
  const orderId = order?.id ?? null
  useEffect(() => {
    setSelected(null)
    setShowAll(false)
    setBusy(false)
    setError(null)
  }, [orderId])

  const options = useMemo(
    () => (order ? driverOptions(order, drivers, openOrders) : []),
    [order, drivers, openOrders],
  )
  const pickable = options.filter((o) => o.state === 'current' || o.state === 'free')
  const unavailable = options.filter((o) => o.state === 'busy' || o.state === 'offline')
  const visible = showAll ? options : pickable
  const choice = options.find((o) => o.driver.uid === selected && o.state === 'free') ?? null

  // If the driver you picked goes offline or gets another job meanwhile, unpick them.
  useEffect(() => {
    if (selected && !choice) setSelected(null)
  }, [selected, choice])

  const confirm = async () => {
    if (!order || !choice) return
    setBusy(true)
    setError(null)
    try {
      await assignDriver(order, choice.driver)
      onClose() // the live board shows the new driver by itself
    } catch (e) {
      setError(dispatchError(e))
      setBusy(false)
    }
  }

  return (
    <Sheet
      visible={order !== null}
      onClose={onClose}
      title={order ? `Who’s taking ${order.code}?` : ''}
      footer={
        <Button
          label={choice ? `Assign ${choice.driver.firstName}` : 'Pick a free driver'}
          disabled={!choice}
          loading={busy}
          onPress={confirm}
        />
      }
    >
      {order ? (
        <AppText variant="small">
          Collect from {order.storeName}, {order.storeAddress.suburbName} → deliver to {order.deliveryAddress.suburbName}
        </AppText>
      ) : null}

      {error ? <Notice tone="danger">{error}</Notice> : null}

      {pickable.every((o) => o.state === 'current') ? (
        <Notice tone="info">
          No drivers are free right now. Drivers show here once they go online and aren’t on another job.
        </Notice>
      ) : null}

      <View style={{ gap: theme.space[2] }} accessibilityRole="radiogroup">
        {visible.map((option) => (
          <DriverRow
            key={option.driver.uid}
            option={option}
            selected={option.driver.uid === selected}
            onPress={() => setSelected(option.driver.uid)}
          />
        ))}
      </View>

      {unavailable.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAll((v) => !v)}
          style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.7 }]}
        >
          <AppText variant="label">
            {showAll ? 'Hide busy and offline drivers' : `Show busy and offline drivers (${unavailable.length})`}
          </AppText>
        </Pressable>
      ) : null}
    </Sheet>
  )
}

function DriverRow({ option, selected, onPress }: { option: DriverOption; selected: boolean; onPress: () => void }) {
  const { driver, state, coversArea, busyWith } = option
  const pickable = state === 'free'
  const status =
    state === 'current'
      ? 'Current driver'
      : state === 'busy'
        ? `Busy${busyWith ? ` with ${busyWith}` : ''}`
        : state === 'offline'
          ? 'Offline'
          : 'Free'

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !pickable }}
      disabled={!pickable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        !pickable && styles.unavailable,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.dot, selected && styles.dotSelected]} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label" style={{ fontSize: theme.text.base }}>
          {driver.displayName}
        </AppText>
        <AppText variant="small">
          {VEHICLE_LABELS[driver.vehicle.type]}
          {driver.vehicle.registration ? ` · ${driver.vehicle.registration}` : ''}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: theme.space[1] }}>
        <Tag
          label={status}
          color={state === 'free' ? theme.color.success : state === 'current' ? theme.color.info : theme.color.textMuted}
        />
        {coversArea && pickable ? <AppText variant="small">Covers this area</AppText> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.touch,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.borderSubtle,
    backgroundColor: theme.color.surfaceCard,
  },
  selected: { borderColor: theme.color.textStrong, borderWidth: 2 },
  unavailable: { opacity: 0.55 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.color.borderStrong },
  dotSelected: { borderWidth: 6, borderColor: theme.color.textStrong },
  toggle: { minHeight: 40, justifyContent: 'center', alignSelf: 'center', paddingHorizontal: theme.space[2] },
})
