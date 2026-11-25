import { describe, expect, it } from 'vitest'
import { EMPTY_CART, MAX_QUANTITY, cartReducer, groupCart, type CartState } from './cart-logic'

const spaza = { id: 'spaza', name: 'Mama Thandi’s Spaza', vertical: 'essentials' as const }
const kota = { id: 'kota', name: 'Kasi Kota Corner', vertical: 'food' as const }
const bread = { id: 'bread', name: 'White Bread', basePriceCents: 2199 }
const milk = { id: 'milk', name: 'Milk 1L', basePriceCents: 2299 }
const kotaFull = { id: 'full-house', name: 'Full House Kota', basePriceCents: 5500 }

const start: CartState = { ...EMPTY_CART, loaded: true }
const set = (state: CartState, store: typeof spaza | typeof kota, product: typeof bread, quantity: number) =>
  cartReducer(state, { type: 'setQuantity', store, product, quantity })

describe('cartReducer', () => {
  it('adds a product, then changes its quantity instead of adding it twice', () => {
    let cart = set(start, spaza, bread, 1)
    cart = set(cart, spaza, bread, 3)
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0]).toMatchObject({ productId: 'bread', quantity: 3, basePriceCents: 2199 })
    expect(cart.stores.spaza).toEqual(spaza)
  })

  it('removes a line at quantity 0, and forgets the store when it has no lines left', () => {
    let cart = set(start, spaza, bread, 2)
    cart = set(cart, spaza, bread, 0)
    expect(cart.lines).toEqual([])
    expect(cart.stores).toEqual({})
  })

  it(`never goes above ${MAX_QUANTITY} or below 0`, () => {
    expect(set(start, spaza, bread, 500).lines[0]!.quantity).toBe(MAX_QUANTITY)
    expect(set(start, spaza, bread, -3).lines).toEqual([])
  })

  it('keeps the same product from two stores apart', () => {
    let cart = set(start, spaza, bread, 1)
    cart = set(cart, kota, bread, 2)
    expect(cart.lines).toHaveLength(2)
  })

  it('removeStore takes out only that store', () => {
    let cart = set(start, spaza, bread, 1)
    cart = set(cart, kota, kotaFull, 1)
    cart = cartReducer(cart, { type: 'removeStore', storeId: 'spaza' })
    expect(cart.lines.map((l) => l.storeId)).toEqual(['kota'])
    expect(Object.keys(cart.stores)).toEqual(['kota'])
  })

  it('updateLine changes the saved price (checkout found a new price)', () => {
    let cart = set(start, spaza, bread, 1)
    cart = cartReducer(cart, { type: 'updateLine', storeId: 'spaza', productId: 'bread', changes: { basePriceCents: 2399 } })
    expect(cart.lines[0]!.basePriceCents).toBe(2399)
  })

  it('does not change the state it was given (pure function)', () => {
    const before = set(start, spaza, bread, 1)
    const snapshot = JSON.stringify(before)
    set(before, spaza, milk, 2)
    expect(JSON.stringify(before)).toBe(snapshot)
  })
})

describe('groupCart', () => {
  it('groups by store in the order stores were added, with item counts', () => {
    let cart = set(start, kota, kotaFull, 1)
    cart = set(cart, spaza, bread, 2)
    cart = set(cart, spaza, milk, 1)
    const groups = groupCart(cart.lines, cart.stores)
    expect(groups.map((g) => g.store.id)).toEqual(['kota', 'spaza'])
    expect(groups[1]!.itemCount).toBe(3)
    expect(groups[1]!.lines.map((l) => l.productId)).toEqual(['bread', 'milk'])
  })
})
