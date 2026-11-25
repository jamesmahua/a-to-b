import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import type { Product } from '@repo/types'
import { AppText, Notice, Screen, TextField, theme } from '@repo/ui'
import { CartBar } from '../components/CartBar'
import { ProductRow } from '../components/ProductRow'
import { ProductSheet } from '../components/ProductSheet'
import { TopBar } from '../components/TopBar'
import { useCart } from '../lib/cart'
import { searchProducts, searchWords, useStoresForSuburb } from '../lib/catalogue'
import { useSuburb } from '../lib/suburb'

/** How long to wait after the last key press before searching. Saves reads while typing. */
const DEBOUNCE_MS = 400

/** Search products in every store that delivers to the customer's suburb. */
export default function SearchScreen() {
  const { suburb } = useSuburb()
  const stores = useStoresForSuburb(suburb?.id ?? null)
  const cart = useCart()
  const [text, setText] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Product | null>(null)

  // Look up stores by id, to show "From …" and to hide stores that don't deliver here.
  const storesById = useMemo(() => new Map(stores.data.map((s) => [s.id, s])), [stores.data])

  // Debounce: every key press restarts the timer; we only search once typing pauses.
  useEffect(() => {
    if (searchWords(text).length === 0) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    let cancelled = false
    const timer = setTimeout(() => {
      searchProducts(text)
        .then((found) => {
          if (cancelled) return
          setResults(found)
          setError(null)
        })
        .catch(() => !cancelled && setError('Search isn’t working right now. Check your connection and try again.'))
        .finally(() => !cancelled && setSearching(false))
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text])

  const deliverable = results.filter((p) => storesById.has(p.storeId))
  const hiddenCount = results.length - deliverable.length
  const selectedStore = selected ? (storesById.get(selected.storeId) ?? null) : null

  return (
    <View style={{ flex: 1 }}>
      <TopBar back title="Search" />
      <Screen>
        <TextField
          label="What are you looking for?"
          placeholder="e.g. bread, coke, kota"
          value={text}
          onChangeText={setText}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          hint={suburb ? `Stores delivering to ${suburb.name}` : 'Choose your suburb on Home to see what delivers to you'}
        />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {searching ? <ActivityIndicator color={theme.color.textStrong} /> : null}

        {!searching && searchWords(text).length > 0 && deliverable.length === 0 && !error ? (
          <AppText>
            Nothing found for “{text.trim()}”
            {hiddenCount > 0 ? `. ${hiddenCount} ${hiddenCount === 1 ? 'match is' : 'matches are'} from stores that don’t deliver to you.` : '. Try a shorter word.'}
          </AppText>
        ) : null}

        <View>
          {deliverable.map((p) => (
            <ProductRow
              key={`${p.storeId}/${p.id}`}
              product={p}
              storeName={storesById.get(p.storeId)?.name}
              inCart={cart.quantityOf(p.storeId, p.id)}
              onPress={() => setSelected(p)}
            />
          ))}
        </View>
      </Screen>
      <CartBar />
      <ProductSheet product={selected} store={selectedStore} onClose={() => setSelected(null)} />
    </View>
  )
}
