import { Pressable, StyleSheet, View } from 'react-native'
import { formatRand, type Product } from '@repo/types'
import { AppText, ImageTile, Tag, theme } from '@repo/ui'
import { usePricing } from '../lib/pricing'

export interface ProductRowProps {
  product: Product
  /** How many are already in the cart (shows a "2 in cart" tag). */
  inCart: number
  onPress: () => void
  /** Search results show which store each product is from. */
  storeName?: string
}

/** One product in a list. Tapping it opens the product sheet. */
export function ProductRow({ product, inCart, onPress, storeName }: ProductRowProps) {
  const { unitPrice, config } = usePricing()
  const accent = theme.color.vertical[product.vertical]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}${config ? `, ${formatRand(unitPrice(product.basePriceCents))}` : ''}${product.inStock ? '' : ', out of stock'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !product.inStock && styles.unavailable, pressed && { opacity: 0.85 }]}
    >
      <ImageTile imageUrl={product.imageUrl} label={product.name} color={accent} size={48} />
      <View style={styles.text}>
        <AppText variant="label" style={{ fontSize: theme.text.base }} numberOfLines={2}>
          {product.name}
        </AppText>
        {storeName ? <AppText variant="small">{storeName}</AppText> : null}
        <View style={styles.tags}>
          {!product.inStock ? <Tag label="Out of stock" color={theme.color.textMuted} variant="solid" /> : null}
          {inCart > 0 ? <Tag label={`${inCart} in cart`} color={theme.color.success} /> : null}
        </View>
      </View>
      {/* Prices wait for config/pricing, so we never flash a price without the markup. */}
      <AppText variant="label" style={styles.price}>
        {config ? formatRand(unitPrice(product.basePriceCents)) : '…'}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.color.borderSubtle,
    minHeight: theme.touch,
  },
  unavailable: { opacity: 0.6 },
  text: { flex: 1, gap: 2 },
  tags: { flexDirection: 'row', gap: theme.space[2] },
  price: { fontSize: theme.text.base, fontWeight: theme.weight.semibold },
})
