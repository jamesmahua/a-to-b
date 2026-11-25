/**
 * Demo data. Prices are rough Nov 2026 spaza prices, for the demo only.
 */
import type { OpeningHours, StoreCategory, Suburb, Vertical } from '@repo/types'

export const DEMO_PASSWORD = 'Demo1234!'

export const SUBURBS: Omit<Suburb, 'id'>[] = [
  'Benoni Central',
  'Northmead',
  'Rynfield',
  'Farrarmere',
  'Crystal Park',
  'Actonville',
  'Wattville',
  'Daveyton',
  'Etwatwa',
  'Boksburg North',
  'Germiston',
  'Kempton Park',
].map((name, i) => ({ name, region: 'East Rand', active: true, sort: i + 1 }))

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const EVERY_DAY = (open: string, close: string, sunday?: [string, string] | null): OpeningHours => ({
  mon: { open, close },
  tue: { open, close },
  wed: { open, close },
  thu: { open, close },
  fri: { open, close },
  sat: { open, close },
  sun: sunday === null ? null : { open: sunday?.[0] ?? open, close: sunday?.[1] ?? close },
})

export interface SeedProduct {
  name: string
  category: string
  price: number // rands, converted to cents by the seed
  tags?: string
  inStock?: boolean
}

export interface SeedStore {
  id: string
  name: string
  vertical: Vertical
  description: string
  phone: string
  line1: string
  suburb: string
  deliversTo: string[]
  hours: OpeningHours
  categories: string[]
  products: SeedProduct[]
}

const cats = (names: string[]): StoreCategory[] => names.map((name, i) => ({ id: slug(name), name, sort: i + 1 }))
export { cats }

/** The demo store admin's shop: a spaza with ~30 everyday items. */
export const SPAZA: SeedStore = {
  id: 'demo-spaza',
  name: 'Mama Thandi’s Spaza',
  vertical: 'essentials',
  description: 'Bread, milk, airtime-run essentials and snacks. Open early, close late.',
  phone: '0110000001',
  line1: '14 Tom Jones St',
  suburb: 'Benoni Central',
  deliversTo: ['Benoni Central', 'Northmead', 'Rynfield', 'Farrarmere', 'Actonville', 'Wattville'],
  hours: EVERY_DAY('06:00', '21:00', ['07:00', '18:00']),
  categories: ['Bread & bakery', 'Dairy & eggs', 'Pantry', 'Snacks & sweets', 'Cold drinks', 'Household'],
  products: [
    { name: 'Albany Superior White Bread 700g', category: 'Bread & bakery', price: 21.99, tags: 'loaf' },
    { name: 'Sasko Brown Bread 700g', category: 'Bread & bakery', price: 19.99, tags: 'loaf' },
    { name: 'Vetkoek (4 pack)', category: 'Bread & bakery', price: 16 },
    { name: 'Clover Full Cream Milk 1L', category: 'Dairy & eggs', price: 22.99 },
    { name: 'Clover Amasi 2L', category: 'Dairy & eggs', price: 39.99, tags: 'maas sour milk' },
    { name: 'Large Eggs (6)', category: 'Dairy & eggs', price: 24.99 },
    { name: 'Rama Original 500g', category: 'Dairy & eggs', price: 36.99, tags: 'margarine butter' },
    { name: 'Iwisa Super Maize Meal 2.5kg', category: 'Pantry', price: 42.99, tags: 'pap mielie meal' },
    { name: 'Tastic Rice 2kg', category: 'Pantry', price: 44.99 },
    { name: 'Selati White Sugar 2.5kg', category: 'Pantry', price: 54.99 },
    { name: 'Sunfoil Sunflower Oil 750ml', category: 'Pantry', price: 39.99, tags: 'cooking oil' },
    { name: 'Lucky Star Pilchards in Tomato 400g', category: 'Pantry', price: 26.99, tags: 'fish tin' },
    { name: 'Koo Baked Beans 410g', category: 'Pantry', price: 17.99, tags: 'tin' },
    { name: 'Royco Soup Oxtail 50g', category: 'Pantry', price: 9.99 },
    { name: 'Joko Tea 100 bags', category: 'Pantry', price: 54.99 },
    { name: 'Ricoffy 250g', category: 'Pantry', price: 64.99, tags: 'coffee' },
    { name: 'Simba Chips Salt & Vinegar 120g', category: 'Snacks & sweets', price: 19.99, tags: 'crisps' },
    { name: 'NikNaks Cheese 135g', category: 'Snacks & sweets', price: 18.99 },
    { name: 'Fizzer (each)', category: 'Snacks & sweets', price: 3, tags: 'sweets' },
    { name: 'Bar One 52g', category: 'Snacks & sweets', price: 15.99, tags: 'chocolate' },
    { name: 'Coca-Cola 2L', category: 'Cold drinks', price: 27.99, tags: 'coke cooldrink soda' },
    { name: 'Stoney Ginger Beer 2L', category: 'Cold drinks', price: 24.99, tags: 'cooldrink soda' },
    { name: 'Oros Orange 2L', category: 'Cold drinks', price: 49.99, tags: 'squash juice' },
    { name: 'Aquelle Still Water 1.5L', category: 'Cold drinks', price: 13.99 },
    { name: 'Sunlight Dishwashing Liquid 750ml', category: 'Household', price: 27.99, tags: 'soap' },
    { name: 'Handy Andy Cream 750ml', category: 'Household', price: 32.99, tags: 'cleaner' },
    { name: 'Twinsaver Toilet Paper (4)', category: 'Household', price: 29.99, tags: 'toilet roll' },
    { name: 'Lifebuoy Soap Bar 175g', category: 'Household', price: 14.99 },
    { name: 'Household Candles (6)', category: 'Household', price: 29.99, tags: 'loadshedding' },
    { name: 'Lion Matches (10 boxes)', category: 'Household', price: 12.99, inStock: false },
  ],
}

/** A second store (food), so multi-store baskets and verticals can be tested. */
export const KOTA: SeedStore = {
  id: 'demo-kota',
  name: 'Kasi Kota Corner',
  vertical: 'food',
  description: 'Kotas, chips and russians made fresh.',
  phone: '0110000002',
  line1: '3 Mphahlele St',
  suburb: 'Wattville',
  deliversTo: ['Wattville', 'Actonville', 'Benoni Central', 'Daveyton'],
  hours: EVERY_DAY('10:00', '22:00'),
  categories: ['Kotas', 'Chips', 'Drinks'],
  products: [
    { name: 'Quarter Kota: chips, polony, atchar', category: 'Kotas', price: 25 },
    { name: 'Full House Kota', category: 'Kotas', price: 55, tags: 'russian cheese egg' },
    { name: 'Russian & Chips', category: 'Kotas', price: 40 },
    { name: 'Small Slap Chips', category: 'Chips', price: 20 },
    { name: 'Large Slap Chips', category: 'Chips', price: 35 },
    { name: 'Coca-Cola 500ml', category: 'Drinks', price: 15, tags: 'coke' },
    { name: 'Iron Brew 500ml', category: 'Drinks', price: 14 },
  ],
}
