import { StyleSheet, View } from 'react-native'
import { AppText, theme } from '@repo/ui'
import type { StepState, TrackingStep } from '../lib/tracking'

/** "18:05". South African 24-hour time. */
function timeOf(date: Date): string {
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

/**
 * The vertical timeline: a dot per step, joined by a line.
 * It only draws what `getTracking()` decided, so there's no order logic in here.
 */
export function TrackingTimeline({ steps }: { steps: TrackingStep[] }) {
  return (
    <View accessibilityRole="list">
      {steps.map((step, i) => {
        const last = i === steps.length - 1
        return (
          <View key={step.key} style={styles.row} accessible accessibilityLabel={describe(step)}>
            {/* Left column: the dot, and the line down to the next dot */}
            <View style={styles.rail}>
              <View style={[styles.dot, DOT[step.state]]} />
              {last ? null : <View style={[styles.line, step.state === 'done' && styles.lineDone]} />}
            </View>
            {/* Right column: label and time */}
            <View style={styles.text}>
              <AppText variant="label" style={[styles.label, LABEL[step.state]]}>
                {step.label}
              </AppText>
              {step.at ? <AppText variant="small">{timeOf(step.at)}</AppText> : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}

/** What a screen reader says: "Store accepted, done, 18:05". */
function describe(step: TrackingStep): string {
  const state = { done: 'done', current: 'happening now', upcoming: 'not yet', skipped: 'won’t happen' }[step.state]
  return [step.label, state, step.at ? timeOf(step.at) : null].filter(Boolean).join(', ')
}

const DOT_SIZE = 16

// One style per state. `Record<StepState, …>` makes TypeScript complain if a state is ever forgotten.
const DOT: Record<StepState, object> = {
  done: { backgroundColor: theme.color.success, borderColor: theme.color.success },
  current: { backgroundColor: theme.color.brandPrimary, borderColor: theme.color.textStrong, borderWidth: 3 },
  upcoming: { backgroundColor: theme.color.surfaceCard, borderColor: theme.color.borderStrong },
  skipped: { backgroundColor: theme.color.surfaceSunken, borderColor: theme.color.borderSubtle },
}
const LABEL: Record<StepState, object> = {
  done: {},
  current: { fontWeight: theme.weight.bold, color: theme.color.textStrong },
  upcoming: { color: theme.color.textMuted },
  skipped: { color: theme.color.textMuted, textDecorationLine: 'line-through' },
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.space[3], minHeight: 52 },
  rail: { width: DOT_SIZE, alignItems: 'center' },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, borderWidth: 2 },
  line: { flex: 1, width: 2, backgroundColor: theme.color.borderSubtle, marginVertical: 2 },
  lineDone: { backgroundColor: theme.color.success },
  text: { flex: 1, paddingBottom: theme.space[3] },
  label: { fontSize: theme.text.base },
})
