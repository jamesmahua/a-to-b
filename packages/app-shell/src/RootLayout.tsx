import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { Role } from '@repo/types'
import { AuthProvider } from '@repo/firebase'
import { theme } from '@repo/ui'

/**
 * Every app's src/app/_layout.tsx is just:
 *   export default function Layout() { return <RootLayout appRole="driver" /> }
 */
export function RootLayout({ appRole }: { appRole: Role }) {
  return (
    <SafeAreaProvider>
      <AuthProvider appRole={appRole}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.color.surfacePage },
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
