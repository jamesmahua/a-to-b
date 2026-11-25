import { describe, expect, it } from 'vitest'
import { buildKeywords, type Product, type Store } from '@repo/types'
import { matchesSearch, searchWords, sortProducts, storeProblem } from './catalogue-logic'

const product = (name: string, extra: Partial<Product> = {}) =>
  ({ id: name, name, nameLower: name.toLowerCase(), keywords: buildKeywords(name), categoryId: 'c1', sort: 0, ...extra }) as Product

describe('searchWords', () => {
  it('lowercases, splits on anything that isn’t a letter or digit, and drops 1-letter bits', () => {
    expect(searchWords('  Coke 2L! a ')).toEqual(['coke', '2l'])
    expect(searchWords('')).toEqual([])
  })
})

describe('matchesSearch', () => {
  const bread = product('Albany Superior White Bread 700g', { keywords: buildKeywords('Albany Superior White Bread 700g', 'loaf') })

  it('matches whole words anywhere in the name or tags', () => {
    expect(matchesSearch(bread, ['bread'])).toBe(true)
    expect(matchesSearch(bread, ['loaf'])).toBe(true)
  })

  it('matches half-typed words', () => {
    expect(matchesSearch(bread, ['brea'])).toBe(true)
    expect(matchesSearch(bread, ['white', 'bre'])).toBe(true)
  })

  it('needs every word to match', () => {
    expect(matchesSearch(bread, ['bread', 'brown'])).toBe(false)
  })
})

describe('sortProducts', () => {
  it('sorts by category order, then product order, then name', () => {
    const store = { categories: [{ id: 'drinks', name: 'Drinks', sort: 2 }, { id: 'bread', name: 'Bread', sort: 1 }] }
    const sorted = sortProducts(
      [
        product('Coke', { categoryId: 'drinks', sort: 1 }),
        product('Vetkoek', { categoryId: 'bread', sort: 2 }),
        product('Brown loaf', { categoryId: 'bread', sort: 1 }),
        product('Amasi', { categoryId: 'unknown', sort: 0 }),
      ],
      store,
    )
    expect(sorted.map((p) => p.name)).toEqual(['Brown loaf', 'Vetkoek', 'Coke', 'Amasi'])
  })
})

describe('storeProblem', () => {
  const northmead = { id: 'northmead', name: 'Northmead' }
  const store = { name: 'Spaza', tradingStatus: 'open', deliverySuburbIds: ['northmead'] } as Store

  it('is null when the store is open and delivers there', () => {
    expect(storeProblem(store, 'Spaza', northmead)).toBeNull()
  })
  it('explains a closed or paused store', () => {
    expect(storeProblem({ ...store, tradingStatus: 'paused' }, 'Spaza', northmead)).toMatch(/isn’t taking orders/)
  })
  it('explains a store that doesn’t deliver to the suburb', () => {
    expect(storeProblem({ ...store, deliverySuburbIds: ['wattville'] }, 'Spaza', northmead)).toMatch(/doesn’t deliver to Northmead/)
  })
  it('explains a store that is gone', () => {
    expect(storeProblem(null, 'Spaza', northmead)).toMatch(/no longer on Klick&Kolleka/)
  })
})
