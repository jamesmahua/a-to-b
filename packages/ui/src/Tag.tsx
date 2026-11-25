import { StyleSheet, View } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

export interface TagProps {
  label: string
  /**
   * Accent colour, e.g. `theme.color.vertical.food`. The tag uses it for the
   * dot and border only, so the text stays readable on any accent.
   */
  color?: string
  /** `solid` fills the tag (for strong states like "Closed"). */
  variant?: 'outline' | 'solid'
}

/** Small label pill: a store's vertical, "Out of stock", "Closed"… */
export function Tag({ label, color = theme.color.textMuted, variant = 'outline' }: TagProps) {
  const solid = variant === 'solid'
  return (
    <View style={[styles.tag, { borderColor: color }, solid && { backgroundColor: color }]}>
      {solid ? null : <View style={[styles.dot, { backgroundColor: color }]} />}
      <AppText variant="small" style={[styles.text, solid && { color: theme.color.textInverse }]}>
        {label}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space[1],
    paddingHorizontal: theme.space[2],
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: theme.text.xs, fontWeight: theme.weight.semibold, color: theme.color.textBody },
})
