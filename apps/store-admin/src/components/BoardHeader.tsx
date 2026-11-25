import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { signOut } from '@repo/firebase'
import { TRADING_STATUS_LABELS, type TradingStatus } from '@repo/types'
import { AppText, Tag, theme } from '@repo/ui'

const TRADING_COLOURS: Record<TradingStatus, string> = {
  open: theme.color.success,
  paused: theme.color.warning,
  closed: theme.color.textMuted,
}

/** Top of the store admin app: store name, open/paused/closed, log out. */
export function BoardHeader({ storeName, tradingStatus }: { storeName: string; tradingStatus?: TradingStatus }) {
  const insets = useSafeAreaInsets() // keeps clear of the phone's notch / status bar
  return (
    <View style={[styles.bar, { paddingTop: theme.space[2] + insets.top }]}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: theme.space[1] }}>
          <AppText variant="heading" numberOfLines={1}>
            {storeName}
          </AppText>
          {tradingStatus ? (
            <Tag label={TRADING_STATUS_LABELS[tradingStatus]} color={TRADING_COLOURS[tradingStatus]} />
          ) : null}
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
  row: { width: '100%', maxWidth: 640, flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  button: { minHeight: theme.touch, justifyContent: 'center', paddingHorizontal: theme.space[2] },
})
