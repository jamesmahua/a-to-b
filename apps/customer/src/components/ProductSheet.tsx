import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { formatRand, type Product, type Store } from '@repo/types'
import { AppText, Button, Notice, QuantityStepper, Sheet, Stack, theme } from '@repo/ui'
import { MAX_QUANTITY, useCart } from '../lib/cart'
import { usePricing } from '../lib/pricing'

export interface ProductSheetProps {
  /** The product to show, or null when the sheet is closed. */
  product: Product | null
  store: Pick<Store, 'id' | 'name' | 'vertical' | 'tradingStatus'> | null
  onClose: () => void
}

/**
 * Product detail as a bottom sheet: description, price, quantity and
 * "Add to cart". A sheet keeps the store page underneath, so closing it
 * costs no extra data.
 */
export function ProductSheet({ product, store, onClose }: ProductSheetProps) {
  const cart = useCart()
  const { unitPrice, config } = usePricing()
  const inCart = product && store ? cart.quantityOf(store.id, product.id) : 0
  const [quantity, setQuantity] = useState(1)

  // Each time a product opens, start from what's in the cart (or 1).
  useEffect(() => {
    if (product) setQuantity(inCart > 0 ? inCart : 1)
    // Only when a different product opens, not each time the cart changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id])

  if (!product || !store) return null

  const open = store.tradingStatus === 'open'
  const canAdd = open && product.inStock && !!config
  const price = unitPrice(product.basePriceCents)

  function save(qty: number) {
    if (!product || !store) return
    cart.setQuantity(store, product, qty)
    onClose()
  }

  let label = `Add ${quantity} to cart · ${formatRand(price * quantity)}`
  if (inCart > 0) label = quantity === inCart ? 'Done' : `Update cart · ${formatRand(price * quantity)}`

  return (
    <Sheet
      visible
      onClose={onClose}
      title={product.name}
      footer={
        <Stack gap={2}>
          {canAdd ? (
            <View style={{ alignItems: 'center' }}>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={MAX_QUANTITY} label={`Quantity of ${product.name}`} />
            </View>
          ) : null}
          <Button label={label} onPress={() => save(quantity)} disabled={!canAdd} />
          {inCart > 0 ? <Button label="Remove from cart" variant="ghost" onPress={() => save(0)} /> : null}
        </Stack>
      }
    >
      <AppText variant="title">{config ? formatRand(price) : '…'}</AppText>
      {product.description ? <AppText>{product.description}</AppText> : null}
      <AppText variant="small">From {store.name}</AppText>
      {!product.inStock ? <Notice>Out of stock right now. Check again later.</Notice> : null}
      {!open ? <Notice>{store.name} isn’t taking orders right now. You can still look around.</Notice> : null}
      {config && config.markupBps > 0 ? (
        <AppText variant="small" style={{ color: theme.color.textMuted }}>
          Price includes Klick&Kolleka’s {config.markupBps / 100}% markup. All fees are shown before you pay.
        </AppText>
      ) : null}
    </Sheet>
  )
}
