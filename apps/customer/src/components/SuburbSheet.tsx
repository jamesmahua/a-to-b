import { Pressable, StyleSheet } from 'react-native'
import { AppText, Notice, Sheet, theme } from '@repo/ui'
import { useSuburb } from '../lib/suburb'

/** Pick the suburb to deliver to. Tapping one saves it and closes the sheet. */
export function SuburbSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { suburbs, suburb, setSuburb, error } = useSuburb()
  return (
    <Sheet visible={visible} onClose={onClose} title="Where should we deliver?">
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {suburbs.map((s) => {
        const selected = s.id === suburb?.id
        return (
          <Pressable
            key={s.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              setSuburb(s.id)
              onClose()
            }}
            style={({ pressed }) => [styles.row, selected && styles.selected, pressed && { opacity: 0.8 }]}
          >
            <AppText variant="label" style={{ fontSize: theme.text.base }}>
              {s.name}
            </AppText>
            <AppText variant="small">{selected ? 'Selected' : s.region}</AppText>
          </Pressable>
        )
      })}
    </Sheet>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: theme.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.borderSubtle,
    backgroundColor: theme.color.surfaceCard,
  },
  selected: { borderColor: theme.color.borderStrong, borderWidth: 2 },
})
