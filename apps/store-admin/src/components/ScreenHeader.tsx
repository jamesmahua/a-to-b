import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, theme } from '@repo/ui'

/**
 * Header for screens below the board: "← Orders" and a title.
 * Goes back if there's history; otherwise (e.g. a link opened in a new tab) goes to the board.
 */
export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.bar, { paddingTop: theme.space[2] + insets.top }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to orders"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
        >
          <AppText variant="label">← Orders</AppText>
        </Pressable>
        <AppText variant="heading" numberOfLines={1} style={{ flex: 1 }}>
          {title}
        </AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: theme.space[5],
    paddingBottom: theme.space[2],
    backgroundColor: theme.color.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.borderSubtle,
    alignItems: 'center',
  },
  row: { width: '100%', maxWidth: 640, flexDirection: 'row', alignItems: 'center', gap: theme.space[2], minHeight: theme.touch },
  button: { minHeight: theme.touch, justifyContent: 'center', paddingRight: theme.space[2] },
})
