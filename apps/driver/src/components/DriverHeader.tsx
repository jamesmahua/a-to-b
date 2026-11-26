import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { signOut } from '@repo/firebase'
import { AppText, theme } from '@repo/ui'

/** Top of the driver app: who's logged in, a one-line status, log out. */
export function DriverHeader({ name, summary }: { name: string; summary?: string }) {
  const insets = useSafeAreaInsets() // keeps clear of the phone's notch / status bar
  return (
    <View style={[styles.bar, { paddingTop: theme.space[2] + insets.top }]}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="small">K&K Driver</AppText>
          <AppText variant="heading" numberOfLines={1}>
            {name}
          </AppText>
          {summary ? <AppText variant="small">{summary}</AppText> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => signOut()}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
        >
          <AppText variant="label">Log out</AppText>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[3],
    backgroundColor: theme.color.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.borderSubtle,
    alignItems: 'center',
  },
  row: { width: '100%', maxWidth: 560, flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  button: { minHeight: theme.touch, justifyContent: 'center', paddingHorizontal: theme.space[2] },
})
