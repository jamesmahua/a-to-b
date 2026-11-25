import { Pressable, StyleSheet, View } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

export interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Read out by screen readers, e.g. "Quantity of Coca-Cola 2L". */
  label?: string
}

/** − 2 + control. Buttons are 48px so they're easy to hit on a small phone. */
export function QuantityStepper({ value, onChange, min = 0, max = 99, label = 'Quantity' }: QuantityStepperProps) {
  const canDecrease = value > min
  const canIncrease = value < max
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      <StepButton symbol="−" hint={`Remove one`} disabled={!canDecrease} onPress={() => onChange(value - 1)} />
      <AppText variant="heading" style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </AppText>
      <StepButton symbol="+" hint={`Add one`} disabled={!canIncrease} onPress={() => onChange(value + 1)} />
    </View>
  )
}

function StepButton({ symbol, hint, disabled, onPress }: { symbol: string; hint: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <AppText variant="heading">{symbol}</AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  button: {
    width: theme.touch,
    height: theme.touch,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceCard,
  },
  value: { minWidth: 32, textAlign: 'center' },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.8 },
})
