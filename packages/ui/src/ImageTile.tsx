import { Image, StyleSheet, View } from 'react-native'
import { theme } from '@repo/tokens'
import { AppText } from './AppText'

export interface ImageTileProps {
  /** Photo URL. `null` until Firebase Storage is set up (spec §4), so the tile is the usual case for now. */
  imageUrl: string | null
  /** Used for the initials and for screen readers. */
  label: string
  /** Tile colour when there's no photo, e.g. the store's vertical accent. */
  color: string
  size?: number
}

/** First letters of the first two words: "Kasi Kota Corner" → "KK". */
function initials(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

/**
 * A square picture for a store or product. Falls back to a coloured tile with
 * initials, which also costs no data: good for low-data users (spec §9.2).
 */
export function ImageTile({ imageUrl, label, color, size = 56 }: ImageTileProps) {
  const box = { width: size, height: size, borderRadius: theme.radius.md }
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[box, styles.image]} accessibilityLabel={label} resizeMode="cover" />
  }
  return (
    <View style={[box, styles.tile, { backgroundColor: color }]} accessibilityLabel={label} accessible>
      <AppText style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>{initials(label)}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  image: { backgroundColor: theme.color.surfaceSunken },
  tile: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: theme.weight.bold },
})
