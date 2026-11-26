import { Linking, StyleSheet, View } from 'react-native'
import { formatRand, nextStatusesFor, type Address, type Order } from '@repo/types'
import { AppText, Button, Card, Tag, theme } from '@repo/ui'
import { STAGE_TAG, addressText, itemCountText, itemLines, jobStage, mapsUrl, stageCopy, type JobStage } from '../lib/jobs'

interface JobCardProps {
  order: Order
  onCollect: () => void
  onDeliver: () => void
}

const STAGE_COLOR: Record<JobStage, string> = {
  to_store: theme.color.warning,
  collect: theme.color.success,
  deliver: theme.color.info,
}

/**
 * The driver's current job: where to go, what to show, what to tap next.
 * Buttons come from `nextStatusesFor('driver', status)`, the same table the
 * security rules enforce, so the app never offers a move the rules would refuse.
 */
export function JobCard({ order, onCollect, onDeliver }: JobCardProps) {
  const stage = jobStage(order.status)
  if (!stage) return null
  const copy = stageCopy(stage, order.customerFirstName)
  const moves = nextStatusesFor('driver', order.status)
  const delivering = stage === 'deliver'

  return (
    <Card>
      <View style={styles.top}>
        <AppText variant="code">{order.code}</AppText>
        <Tag label={STAGE_TAG[stage]} color={STAGE_COLOR[stage]} />
      </View>

      <View style={{ gap: theme.space[1] }}>
        <AppText variant="title">{copy.title}</AppText>
        <AppText variant="small">{copy.hint}</AppText>
      </View>

      {/* Collection code: shown from the moment the job is assigned, so the driver has it on arrival. */}
      {!delivering ? (
        <View style={styles.codeBox}>
          <AppText variant="small">Show this code at the counter</AppText>
          <AppText
            variant="code"
            style={styles.bigCode}
            accessibilityLabel={`Collection code ${order.collectionCode.split('').join(' ')}`}
          >
            {order.collectionCode}
          </AppText>
        </View>
      ) : null}

      {moves.includes('out_for_delivery') ? <Button label="I’ve collected it" onPress={onCollect} /> : null}
      {moves.includes('delivered') ? <Button label="Delivered" onPress={onDeliver} /> : null}

      <Place
        heading="Drop off"
        name={order.customerFirstName}
        address={order.deliveryAddress}
        note={order.deliveryInstructions}
        directionsLabel={`Directions to ${order.customerFirstName}`}
        primary={delivering}
      />

      <Place
        heading="Pick up"
        name={order.storeName}
        address={order.storeAddress}
        directionsLabel="Directions to the store"
        primary={!delivering}
        compact={delivering}
      />

      <View style={styles.section}>
        <AppText variant="label">{itemCountText(order.itemCount)} · check the bag</AppText>
        {itemLines(order.items).map((line, i) => (
          <AppText key={i} variant="small">
            {line}
          </AppText>
        ))}
      </View>

      <View style={styles.earn}>
        <AppText variant="label">You earn</AppText>
        <AppText variant="heading">{formatRand(order.pricing.driverPayoutCents)}</AppText>
      </View>
    </Card>
  )
}

interface PlaceProps {
  heading: string
  name: string
  address: Address
  note?: string | null
  directionsLabel: string
  /** The place the driver is heading to now: its directions button stands out. */
  primary: boolean
  /** Already been there: one line, no button. */
  compact?: boolean
}

function Place({ heading, name, address, note, directionsLabel, primary, compact }: PlaceProps) {
  if (compact) {
    return (
      <View style={styles.section}>
        <AppText variant="small">
          {heading}: {name}, {address.suburbName}
        </AppText>
      </View>
    )
  }
  return (
    <View style={styles.section}>
      <AppText variant="small">{heading}</AppText>
      <AppText variant="heading">{name}</AppText>
      <AppText>{addressText(address)}</AppText>
      {note ? <AppText variant="small">Note: {note}</AppText> : null}
      <Button
        label={directionsLabel}
        variant={primary ? 'secondary' : 'ghost'}
        onPress={() => void Linking.openURL(mapsUrl(address))}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space[2] },
  codeBox: {
    alignItems: 'center',
    gap: theme.space[1],
    padding: theme.space[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfacePage,
  },
  bigCode: { fontSize: theme.text['3xl'], letterSpacing: 8 },
  section: {
    gap: theme.space[1],
    paddingTop: theme.space[3],
    borderTopWidth: 1,
    borderTopColor: theme.color.borderSubtle,
  },
  earn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.space[3],
    borderTopWidth: 1,
    borderTopColor: theme.color.borderSubtle,
  },
})
