import { useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { TRADING_STATUS_LABELS, VERTICAL_LABELS, type Product } from '@repo/types'
import { AppText, Button, Card, ChipTabs, ImageTile, Notice, Screen, Stack, Tag, theme, type ChipOption } from '@repo/ui'
import { CartBar } from '../../components/CartBar'
import { ProductRow } from '../../components/ProductRow'
import { ProductSheet } from '../../components/ProductSheet'
import { TopBar } from '../../components/TopBar'
import { useCart } from '../../lib/cart'
import { useStore, useStoreProducts } from '../../lib/catalogue'
import { useSuburb } from '../../lib/suburb'

/** A store's page: its details, category filter and products. `[storeId]` in the file name = the id in the URL. */
export default function StorePage() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>()
  const store = useStore(storeId)
  const products = useStoreProducts(store.data)
  const cart = useCart()
  const { suburb } = useSuburb()
  const [category, setCategory] = useState<string>('all')
  const [selected, setSelected] = useState<Product | null>(null)

  const s = store.data

  // Only categories that have products, in the store's order.
  const categories = useMemo(() => {
    if (!s) return []
    const used = new Set(products.data.map((p) => p.categoryId))
    return [...s.categories].sort((a, b) => a.sort - b.sort).filter((c) => used.has(c.id))
  }, [s, products.data])

  // Products whose category was deleted or never set still need to show somewhere.
  const knownIds = new Set(categories.map((c) => c.id))
  const uncategorised = products.data.filter((p) => !knownIds.has(p.categoryId))

  const chipOptions: ChipOption<string>[] = [{ value: 'all', label: 'All' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]
  const visibleCategories = category === 'all' ? categories : categories.filter((c) => c.id === category)

  if (store.loading) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar back />
        <Screen centered>
          <ActivityIndicator color={theme.color.textStrong} />
        </Screen>
      </View>
    )
  }

  if (!s) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar back title="Store" />
        <Screen>
          {store.error ? <Notice tone="danger">{store.error}</Notice> : null}
          <Card>
            <AppText variant="heading">We can’t find that store</AppText>
            <AppText>It may have closed down or the link is wrong.</AppText>
          </Card>
        </Screen>
      </View>
    )
  }

  const accent = theme.color.vertical[s.vertical]
  const open = s.tradingStatus === 'open'
  const deliversHere = !suburb || s.deliverySuburbIds.includes(suburb.id)

  return (
    <View style={{ flex: 1 }}>
      <TopBar back title={s.name} />
      <Screen>
        <View style={{ flexDirection: 'row', gap: theme.space[4], alignItems: 'center' }}>
          <ImageTile imageUrl={s.imageUrl} label={s.name} color={accent} size={72} />
          <Stack gap={1} style={{ flex: 1 }}>
            <AppText variant="title">{s.name}</AppText>
            <AppText variant="small">
              {s.address.line1}, {s.address.suburbName}
            </AppText>
            <View style={{ flexDirection: 'row', gap: theme.space[2], flexWrap: 'wrap' }}>
              <Tag label={VERTICAL_LABELS[s.vertical]} color={accent} />
              <Tag label={TRADING_STATUS_LABELS[s.tradingStatus]} color={open ? theme.color.success : theme.color.textMuted} variant={open ? 'outline' : 'solid'} />
            </View>
          </Stack>
        </View>
        {s.description ? <AppText>{s.description}</AppText> : null}

        {!open ? <Notice>{s.name} isn’t taking orders right now. You can still look around.</Notice> : null}
        {!deliversHere && suburb ? <Notice>{s.name} doesn’t deliver to {suburb.name}.</Notice> : null}

        {categories.length > 1 ? (
          <ChipTabs options={chipOptions} value={category} onChange={setCategory} accessibilityLabel="Product categories" />
        ) : null}

        {products.loading ? <ActivityIndicator color={theme.color.textStrong} /> : null}
        {products.error ? (
          <Stack gap={2}>
            <Notice tone="danger">{products.error}</Notice>
            <Button label="Try again" variant="secondary" onPress={products.reload} />
          </Stack>
        ) : null}
        {!products.loading && !products.error && products.data.length === 0 ? (
          <AppText>This store hasn’t added any products yet.</AppText>
        ) : null}

        {visibleCategories.map((c) => (
          <View key={c.id}>
            <AppText variant="heading" style={{ marginBottom: theme.space[1] }}>
              {c.name}
            </AppText>
            {products.data
              .filter((p) => p.categoryId === c.id)
              .map((p) => (
                <ProductRow key={p.id} product={p} inCart={cart.quantityOf(s.id, p.id)} onPress={() => setSelected(p)} />
              ))}
          </View>
        ))}

        {category === 'all' && uncategorised.length > 0 ? (
          <View>
            {categories.length > 0 ? (
              <AppText variant="heading" style={{ marginBottom: theme.space[1] }}>
                Other
              </AppText>
            ) : null}
            {uncategorised.map((p) => (
              <ProductRow key={p.id} product={p} inCart={cart.quantityOf(s.id, p.id)} onPress={() => setSelected(p)} />
            ))}
          </View>
        ) : null}
      </Screen>
      <CartBar />
      <ProductSheet product={selected} store={s} onClose={() => setSelected(null)} />
    </View>
  )
}
