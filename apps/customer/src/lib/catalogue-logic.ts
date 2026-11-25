/**
 * Pure helpers for stores and products: no Firestore, no React, so they're
 * easy to unit test (catalogue-logic.test.ts).
 */
import type { Product, Store } from '@repo/types'

/** Sorts by the store's category order, then the product's own order, then name. */
export function sortProducts(products: Product[], store: Pick<Store, 'categories'>): Product[] {
  const categoryRank = new Map(store.categories.map((c) => [c.id, c.sort]))
  return [...products].sort(
    (a, b) =>
      (categoryRank.get(a.categoryId) ?? 999) - (categoryRank.get(b.categoryId) ?? 999) ||
      a.sort - b.sort ||
      a.name.localeCompare(b.name),
  )
}

/** "  Coke 2L " → ["coke", "2l"]. Same rules as `buildKeywords()` in @repo/types. */
export function searchWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2)
}

/** True if every word typed is the start of one of the product's words ("brea" matches "bread"). */
export function matchesSearch(product: Pick<Product, 'keywords' | 'nameLower'>, words: string[]): boolean {
  const productWords = [...product.keywords, ...searchWords(product.nameLower)]
  return words.every((w) => productWords.some((pw) => pw.startsWith(w)))
}

/** Why a store can't take this order, in plain words. Pure, so it's easy to test. */
export function storeProblem(store: Store | null, fallbackName: string, suburb: { id: string; name: string }): string | null {
  if (!store) return `${fallbackName} is no longer on Klick&Kolleka.`
  if (store.tradingStatus !== 'open') return `${store.name} isn’t taking orders right now.`
  if (!store.deliverySuburbIds.includes(suburb.id)) return `${store.name} doesn’t deliver to ${suburb.name}.`
  return null
}

