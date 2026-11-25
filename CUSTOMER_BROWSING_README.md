# Customer app: product browsing → cart → checkout (spec §10.1)

## 1. Add the files

1. Unzip `kk-customer-browsing.zip` **into the root of your `a-to-b` folder**. Let it overwrite existing files. The folders inside the zip match the repo.
2. Delete the old placeholder home screen. It has moved up a level, and two `index.tsx` files would clash:

   ```powershell
   Remove-Item "apps\customer\src\app\(app)\index.tsx"
   ```

3. Install. This picks up `vitest` for the customer app's tests:

   ```powershell
   npm install
   ```

## 2. Check it

```powershell
npm run check-types
npx turbo run test --filter=customer      # 18 tests: cart, search, totals
```

## 3. Try it (emulators)

Use three PowerShell windows:

```powershell
npm run emulators          # window 1 (leave running)
npm run seed:emulator      # window 2, once the emulators are up
npm run dev:customer       # window 3 → http://localhost:8081
```

**Demo run-through:**

1. Open Home without logging in and choose **Benoni Central**. Both demo stores deliver there.
2. Open *Mama Thandi's Spaza*, filter by a category, tap a product, and add 2.
3. Go back, open *Kasi Kota Corner* and add a kota. The cart now holds **two stores**.
4. Search for `brea`, then `coke`. Lion Matches shows as out of stock.
5. Open the cart. Each store has its own fees, and there's a grand total.
6. Tap Checkout. You're asked to log in: use `customer@demo.kandk.co.za` / `Demo1234!`. You land back on checkout.
7. Enter a street address and tap **Pay (demo)**. You get two orders with one `basketId`, and the status updates live.
8. Open the store admin app (`npm run dev:store`, log in as `store@demo.kandk.co.za`) and accept the order. The customer's page changes to "Preparing".

## 4. Before using the real project

The search now uses one more Firestore index, already added to `firestore.indexes.json`. Deploy it:

```powershell
npm run deploy:rules
```

## What changed

| Where | What |
|---|---|
| `packages/ui` | New: `Tag`, `ChipTabs`, `QuantityStepper`, `Sheet` (bottom sheet), `ImageTile` (photo or coloured tile) |
| `packages/app-shell` | `RootLayout` takes an optional `Providers` slot; login and sign-up return you to where you were (`?next=/checkout`) |
| `apps/customer/src/app` | Home, store page, search and cart are **public**. Checkout and the order page need login (`(app)` folder) |
| `apps/customer/src/lib` | `cart` (on-device cart), `suburb`, `pricing`, `catalogue` (Firestore reads + search), `checkout`, `totals` + tests |
| `apps/customer/src/components` | `TopBar`, `StoreCard`, `ProductRow`, `ProductSheet`, `CartBar`, `SuburbSheet`, `StoreOrderCard` |
| `firestore.indexes.json` | + collection-group index `products: active, nameLower` (prefix search) |

## Learning notes: where to look first

- **`lib/cart-logic.ts` → `lib/cart.tsx`**: the *reducer + context + hook* pattern. The rules are pure functions (easy to test), and React and storage are wired up separately.
- **`lib/catalogue.ts`**: live reads (`onSnapshot`, for stores) vs one-off reads (`getDocs`, for products), and why every product query filters `active == true` (security rules).
- **`app/search.tsx`**: *debouncing*. It waits 400 ms after the last key press before searching.
- **`lib/checkout.ts`**: re-checking prices and stock before taking money, and placing one order per store with a shared `basketId`.
- **`app/_layout.tsx`**: the route map, and how `(app)` folders put screens behind login without changing the URL.
