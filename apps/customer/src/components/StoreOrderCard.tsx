import { StyleSheet, View } from 'react-native'
import { formatRand, type OrderPricing } from '@repo/types'
import { AppText, Card, QuantityStepper, Tag, theme } from '@repo/ui'
import { MAX_QUANTITY, useCart, type CartGroup } from '../lib/cart'
import { usePricing } from '../lib/pricing'

export interface StoreOrderCardProps {
  group: CartGroup
  /** From `calculateOrderPricing()`: the same maths `placeOrder()` uses, so what's shown is what's charged. */
  pricing: OrderPricing
  /** Cart: quantities can be changed. Checkout: read-only. */
  editable?: boolean
}

/**
 * One store's part of the cart, with every fee on its own line.
 * Showing all fees before payment is the K&K promise, and a CPA requirement (spec §9.3).
 */
export function StoreOrderCard({ group, pricing, editable }: StoreOrderCardProps) {
  const cart = useCart()
  const { unitPrice } = usePricing()
  const accent = theme.color.vertical[group.store.vertical]

  return (
    <Card>
      <View style={styles.header}>
        <AppText variant="heading" style={{ flex: 1 }}>
          {group.store.name}
        </AppText>
        <Tag label={`${group.itemCount} ${group.itemCount === 1 ? 'item' : 'items'}`} color={accent} />
      </View>

      {group.lines.map((line) => (
        <View key={line.productId} style={styles.line}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText>{editable ? line.name : `${line.quantity} × ${line.name}`}</AppText>
            <AppText variant="small">{formatRand(unitPrice(line.basePriceCents))} each</AppText>
          </View>
          {editable ? (
            <QuantityStepper
              value={line.quantity}
              min={0}
              max={MAX_QUANTITY}
              label={`Quantity of ${line.name}`}
              // 0 removes the line from the cart.
              onChange={(qty) => cart.setQuantity(group.store, { id: line.productId, name: line.name, basePriceCents: line.basePriceCents }, qty)}
            />
          ) : (
            <AppText variant="label">{formatRand(unitPrice(line.basePriceCents) * line.quantity)}</AppText>
          )}
        </View>
      ))}

      <View style={styles.divider} />
      <Row label="Items" value={pricing.subtotalCents} />
      <Row label="Service fee" value={pricing.serviceFeeCents} />
      <Row label="Delivery fee" value={pricing.deliveryFeeCents} />
      {pricing.tipCents > 0 ? <Row label="Tip for your driver" value={pricing.tipCents} /> : null}
      <Row label={`Total for ${group.store.name}`} value={pricing.totalCents} strong />
    </Card>
  )
}

export function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText variant={strong ? 'heading' : 'body'} style={{ flex: 1 }}>
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'body'}>{formatRand(value)}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  line: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  divider: { height: 1, backgroundColor: theme.color.borderSubtle },
  row: { flexDirection: 'row', alignItems: 'center' },
})
