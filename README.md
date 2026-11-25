# Klick&Kolleka

*Click it. Get it.* A South African marketplace for food, groceries, essentials, parcels and services.

Four apps, each running on **Android, iOS and in the browser** from one codebase (Expo), sharing one Firebase backend. The full spec lives in the Klick&Kolleka project (`Klick&Kolleka_Technical_Spec.md`).

| App | Folder | Role | Live browser path | Local dev |
|---|---|---|---|---|
| Customer | `apps/customer` | `customer` | `/shop` | http://localhost:8081 |
| Store admin | `apps/store-admin` | `store_admin` | `/store` | http://localhost:8082 |
| Driver | `apps/driver` | `driver` | `/driver` | http://localhost:8083 |
| Super admin | `apps/super-admin` | `super_admin` | `/admin` | http://localhost:8084 |
| Marketing site | `apps/web` | (public) | `/` | http://localhost:3000 |

## Shared packages

| Package | What it holds |
|---|---|
| `packages/types` | **The data model.** Every collection, field, status and the order status table. Pure TypeScript. |
| `packages/firebase` | Firebase setup (phone + browser), login, the `AuthProvider`, typed refs and every order action. |
| `packages/app-shell` | Login, sign-up, role guard and root layout shared by all four apps. |
| `packages/ui` | Design-system components in React Native (render in the browser too). |
| `packages/tokens` | Colours, spacing, type. **Change `ACTIVE_THEME` to restyle every app.** |
| `firestore.rules` | Who can read and write what. Must match `ORDER_TRANSITIONS` in `packages/types/src/order.ts`. |

## First-time setup (Windows / PowerShell)

Needs **Node 24+** (`node -v`) and, for the emulators, **Java 21+** (`java -version`).

```powershell
npm install
npm run env:sync          # copies your Firebase keys into each app (.env.local, never committed)
npm run dev:store         # opens the store admin app in the browser
```

On a phone: install **Expo Go**, run `npm run start -w store-admin`, and scan the QR code.

## Local emulators (recommended for building)

Free, offline, and you can't break real data.

```powershell
npm run emulators         # terminal 1: Auth + Firestore + UI at http://localhost:4000
npm run seed:emulator     # terminal 2: demo accounts, stores, products, orders
```

Then set `EXPO_PUBLIC_USE_EMULATORS=true` in `.env.local`, run `npm run env:sync`, and start an app.

**Demo logins** (password `Demo1234!`): `customer@demo.kandk.co.za`, `store@demo.kandk.co.za`, `kota@demo.kandk.co.za`, `driver@demo.kandk.co.za`, `admin@demo.kandk.co.za`.

## Tests

```powershell
npm test                  # data model: pricing maths + order status table
npm run test:rules        # security rules, against the Firestore emulator (needs Java)
```

## Deploying the rules

```powershell
npx firebase login
npm run deploy:rules      # firestore.rules + firestore.indexes.json → a-two-b
```

## Rules of the road

- Money is always **whole cents** (`basePriceCents: 2199`), shown with `formatRand()`.
- Screens never write order docs directly: use the functions in `@repo/firebase` (`acceptOrder`, `markOrderReady`…).
- Changing an order status rule? Change `ORDER_TRANSITIONS` **and** `firestore.rules`, then run both test suites.
- Never commit `.env.local` or a service-account key.
