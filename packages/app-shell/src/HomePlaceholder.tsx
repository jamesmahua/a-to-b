import { ROLE_APPS, ROLE_LABELS } from '@repo/types'
import { signOut, useAuth, PLATFORM } from '@repo/firebase'
import { AppText, Button, Card, Screen } from '@repo/ui'

/** Temporary home screen until each workstream builds the real one. Proves login + role routing work. */
export function HomePlaceholder({ nextUp }: { nextUp: string }) {
  const { profile, appRole } = useAuth()
  return (
    <Screen centered maxWidth={480}>
      <Card>
        <AppText variant="title">Hi {profile?.firstName ?? 'there'} 👋</AppText>
        <AppText>
          You’re in the {ROLE_APPS[appRole].appName} app as a {ROLE_LABELS[appRole].toLowerCase()}, on {PLATFORM}.
        </AppText>
        <AppText variant="small">Coming next: {nextUp}</AppText>
        <Button label="Log out" variant="secondary" onPress={() => signOut()} />
      </Card>
    </Screen>
  )
}
