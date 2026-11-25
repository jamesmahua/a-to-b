/**
 * Firebase settings, read from each app's `.env.local`.
 *
 * Expo only inlines EXPO_PUBLIC_* variables when they're written out in full like this
 * (no `process.env[name]` lookups), so don't "tidy" this into a loop.
 * Run `npm run env:sync` at the repo root to copy the root .env.local into every app.
 */
export interface FirebaseSettings {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  /** true = talk to the local emulators (npm run emulators) instead of the real project. */
  useEmulators: boolean
  /** Host the emulators run on. On a physical phone, set this to your PC's LAN IP. */
  emulatorHost: string
}

export function readFirebaseSettings(): FirebaseSettings {
  const settings: FirebaseSettings = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
    useEmulators: process.env.EXPO_PUBLIC_USE_EMULATORS === 'true',
    emulatorHost: process.env.EXPO_PUBLIC_EMULATOR_HOST ?? '127.0.0.1',
  }
  if (!settings.useEmulators && (!settings.apiKey || !settings.projectId)) {
    throw new Error(
      'Firebase settings missing. Copy .env.example to .env.local at the repo root, fill it in, then run `npm run env:sync`.',
    )
  }
  return settings
}
