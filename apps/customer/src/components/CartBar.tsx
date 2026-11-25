import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, theme } from '@repo/ui'
import { useCart } from '../lib/cart'

/** Sticks to the bottom of browsing screens while the cart has something in it. */
export function CartBar() {
  const { itemCount, groups } = useCart()
  const router = useRouter()
  const insets = useSafeAreaInsets() // keeps clear of the phone's home bar
  if (itemCount === 0) return null

  const stores = groups.length === 1 ? groups[0]!.store.name : `${groups.length} stores`
  return (
    <View style={[styles.bar, { paddingBottom: theme.space[3] + insets.bottom }]}>
      <View style={styles.inner}>
        <Button label={`View cart · ${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${stores}`} onPress={() => router.push('/cart')} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[5],
    backgroundColor: theme.color.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: theme.color.borderSubtle,
    alignItems: 'center',
  },
  inner: { width: '100%', maxWidth: 560 },
})
