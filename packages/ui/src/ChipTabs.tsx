import { Pressable, ScrollView, StyleSheet } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

export interface ChipOption<T extends string> {
  value: T
  label: string
}

export interface ChipTabsProps<T extends string> {
  options: ChipOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Screen-reader name for the whole row, e.g. "Filter by type". */
  accessibilityLabel?: string
}

/**
 * A row of pill-shaped tabs that scrolls sideways when it doesn't fit.
 * Used for the vertical filter on Home and the categories on a store page.
 *
 * `<T extends string>` makes it generic: pass options typed as `Vertical`
 * and `onChange` gives you a `Vertical` back, not a plain string.
 */
export function ChipTabs<T extends string>({ options, value, onChange, accessibilityLabel }: ChipTabsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
          >
            <AppText variant="label" style={selected ? styles.selectedText : undefined}>
              {option.label}
            </AppText>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: theme.space[2], paddingVertical: theme.space[1] },
  chip: {
    minHeight: 40,
    paddingHorizontal: theme.space[4],
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.color.borderSubtle,
    backgroundColor: theme.color.surfaceCard,
  },
  selected: { backgroundColor: theme.color.textStrong, borderColor: theme.color.textStrong },
  selectedText: { color: theme.color.textInverse },
  pressed: { opacity: 0.8 },
})
