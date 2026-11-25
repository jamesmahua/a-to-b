import { useEffect, type ReactNode } from 'react'
import { ActivityIndicator, Platform, View } from 'react-native'
import { Redirect } from 'expo-router'
import { ROLE_APPS, ROLE_LABELS, type Role } from '@repo/types'
import { signOut, useAuth } from '@repo/firebase'
import { AppText, Button, Card, Notice, Screen, theme } from '@repo/ui'

/**
 * Wraps every screen behind login. Decides between:
 * loading → spinner, signed out → login, wrong role → their own app, allowed → the screen.
 */
export function RequireRole({ children }: { children: ReactNode }) {
  const { access, profile, appRole, correctWebPath } = useAuth()

  if (access === 'loading') return <FullScreenSpinner />
  if (access === 'signed_out') return <Redirect href="/login" />
  if (access === 'no_profile') return <MissingProfile />
  if (access === 'wrong_app' && profile) return <WrongApp appRole={appRole} userRole={profile.role} webPath={correctWebPath} />
  return <>{children}</>
}

export function FullScreenSpinner() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.surfacePage }}>
      <ActivityIndicator size="large" color={theme.color.textStrong} />
    </View>
  )
}

/**
 * Local development: each app runs on its own port (see apps/*\/package.json "dev").
 * Live: one domain, each app under its own path (www.kandk.co.za/store).
 */
const DEV_PORTS: Record<Role, number> = { customer: 8081, store_admin: 8082, driver: 8083, super_admin: 8084 }

export function webUrlForRole(role: Role): string {
  const path = ROLE_APPS[role].webPath
  if (typeof window === 'undefined') return path
  // Dev servers serve each app at the root of its port; live builds sit under their path.
  return __DEV__ ? `http://localhost:${DEV_PORTS[role]}` : `${window.location.origin}${path}`
}

function WrongApp({ appRole, userRole, webPath }: { appRole: Role; userRole: Role; webPath: string | null }) {
  const isWeb = Platform.OS === 'web'
  const target = ROLE_APPS[userRole]

  // Browser: same login works across /shop, /store, /driver and /admin, so just go there.
  useEffect(() => {
    if (isWeb && webPath && !__DEV__) window.location.assign(webUrlForRole(userRole))
  }, [isWeb, webPath, userRole])

  return (
    <Screen centered maxWidth={420}>
      <Card>
        <AppText variant="heading">This is the {ROLE_APPS[appRole].appName} app</AppText>
        <AppText>
          You’re logged in with a {ROLE_LABELS[userRole].toLowerCase()} account, which uses the {target.appName} app.
        </AppText>
        {isWeb ? (
          <Button label={`Go to ${target.appName}`} onPress={() => window.location.assign(webUrlForRole(userRole))} />
        ) : (
          <Notice>Open the {target.appName} app on your phone, or log in with a different account here.</Notice>
        )}
        <Button label="Log out" variant="secondary" onPress={() => signOut()} />
      </Card>
    </Screen>
  )
}

function MissingProfile() {
  return (
    <Screen centered maxWidth={420}>
      <Card>
        <AppText variant="heading">We couldn’t load your account</AppText>
        <AppText>Please log out and sign in again. If it keeps happening, contact Klick&Kolleka support.</AppText>
        <Button label="Log out" variant="secondary" onPress={() => signOut()} />
      </Card>
    </Screen>
  )
}
