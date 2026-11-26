import { StyleSheet, View } from 'react-native'
import { AppText, Button, Card, Notice, theme } from '@repo/ui'
import type { OnlineControl } from '../lib/jobs'

interface OnlineCardProps {
  control: OnlineControl
  busy: boolean
  error: string | null
  onToggle: () => void
}

/**
 * Online / offline. A big button rather than a small switch: easier to hit on a
 * bike, and the label says exactly what will happen.
 */
export function OnlineCard({ control, busy, error, onToggle }: OnlineCardProps) {
  const { online, canToggle, hint } = control
  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: online ? theme.color.success : theme.color.textMuted }]} />
        <AppText variant="heading">{online ? 'You’re online' : 'You’re offline'}</AppText>
      </View>
      <AppText variant="small">{hint}</AppText>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {canToggle ? (
        <Button
          label={online ? 'Go offline' : 'Go online'}
          variant={online ? 'secondary' : 'primary'}
          loading={busy}
          onPress={onToggle}
        />
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  dot: { width: 12, height: 12, borderRadius: 6 },
})
