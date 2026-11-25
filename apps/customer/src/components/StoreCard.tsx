import { Pressable, StyleSheet, View } from 'react-native'
import { Link } from 'expo-router'
import { TRADING_STATUS_LABELS, VERTICAL_LABELS, type Store } from '@repo/types'
import { AppText, ImageTile, Tag, theme } from '@repo/ui'

/** One store in the Home list. The whole card is a link to the store page. */
export function StoreCard({ store }: { store: Store }) {
  const accent = theme.color.vertical[store.vertical]
  const open = store.tradingStatus === 'open'
  return (
    // `asChild` makes the Pressable itself the link, so it works as a real <a> in the browser.
    <Link href={`/stores/${store.id}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${store.name}, ${VERTICAL_LABELS[store.vertical]}${open ? '' : `, ${TRADING_STATUS_LABELS[store.tradingStatus]}`}`}
        style={({ pressed }) => [styles.card, !open && styles.closed, pressed && { opacity: 0.85 }]}
      >
        <ImageTile imageUrl={store.imageUrl} label={store.name} color={accent} size={64} />
        <View style={styles.text}>
          <AppText variant="heading" numberOfLines={1}>
            {store.name}
          </AppText>
          {store.description ? (
            <AppText variant="small" numberOfLines={2}>
              {store.description}
            </AppText>
          ) : null}
          <View style={styles.tags}>
            <Tag label={VERTICAL_LABELS[store.vertical]} color={accent} />
            {open ? null : <Tag label={TRADING_STATUS_LABELS[store.tradingStatus]} color={theme.color.textMuted} variant="solid" />}
          </View>
        </View>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: theme.space[4],
    padding: theme.space[4],
    backgroundColor: theme.color.surfaceCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.borderSubtle,
  },
  closed: { opacity: 0.7 },
  text: { flex: 1, gap: theme.space[1] },
  tags: { flexDirection: 'row', gap: theme.space[2], flexWrap: 'wrap', marginTop: theme.space[1] },
})
