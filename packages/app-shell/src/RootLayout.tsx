import type { ComponentType, ReactNode } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { Role } from '@repo/types'
import { AuthProvider } from '@repo/firebase'
import { theme } from '@repo/ui'

/** Lets an app add its own app-wide state (e.g. the customer's cart) inside login. */
type ProvidersComponent = ComponentType<{ children: ReactNode }>

const NoProviders: ProvidersComponent = ({ children }) => <>{children}</>

/**
 * Every app's src/app/_layout.tsx is just:
 *   export default function Layout() { return <RootLayout appRole="driver" /> }
 *
 * `Providers` is optional. It sits inside AuthProvider, so it can use `useAuth()`.
 */
export function RootLayout({ appRole, Providers = NoProviders }: { appRole: Role; Providers?: ProvidersComponent }) {
  return (
    <SafeAreaProvider>
      <AuthProvider appRole={appRole}>
        <Providers>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.color.surfacePage },
            }}
          />
        </Providers>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
