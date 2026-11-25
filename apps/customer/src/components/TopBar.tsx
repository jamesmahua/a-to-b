import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, theme } from '@repo/ui'

export interface TopBarProps {
  title?: string
  /** Show a "← Back" button. Falls back to Home when there's no history (e.g. a shared browser link). */
  back?: boolean
  /** Anything on the right, e.g. a Search link. */
  right?: ReactNode
  /** Anything under the title row, e.g. the suburb button. */
  children?: ReactNode
}

/** The bar at the top of each customer screen. */
export function TopBar({ title, back, right, children }: TopBarProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets() // keeps clear of the phone's notch / status bar
  return (
    <View style={[styles.bar, { paddingTop: theme.space[2] + insets.top }]}>
      <View style={styles.inner}>
        <View style={styles.row}>
          {back ? (
            <TopBarButton label="← Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          ) : null}
          <AppText variant="heading" numberOfLines={1} style={{ flex: 1 }}>
            {title ?? ''}
          </AppText>
          {right}
        </View>
        {children}
      </View>
    </View>
  )
}

export function TopBarButton({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
    >
      <AppText variant="label">{label}</AppText>
    </Pressable>
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
  inner: { width: '100%', maxWidth: 560, gap: theme.space[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2], minHeight: theme.touch },
  button: { minHeight: theme.touch, justifyContent: 'center', paddingHorizontal: theme.space[2] },
})
