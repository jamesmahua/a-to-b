import { useState } from 'react'
import { Platform } from 'react-native'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { ROLE_APPS } from '@repo/types'
import { friendlyAuthError, sendPasswordReset, signInWithEmail, signInWithGoogle, useAuth } from '@repo/firebase'
import { safeNextPath, withNext } from './RequireRole'
import { AppText, Button, Card, Notice, Screen, Stack, TextField } from '@repo/ui'

/** The same login screen in all four apps. Each app's role decides the title. */
export function LoginScreen() {
  const { appRole } = useAuth()
  const router = useRouter()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const afterLogin = safeNextPath(next)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canSignUp = appRole !== 'super_admin'

  async function handleLogin() {
    setError(null)
    setNotice(null)
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setBusy(true)
    try {
      await signInWithEmail(email, password)
      router.replace(afterLogin)
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    try {
      // Login only: new Google users go through sign-up, where they accept the terms.
      await signInWithGoogle(appRole === 'super_admin' ? 'customer' : appRole, { acceptedTerms: false, marketingOptIn: false })
      router.replace(afterLogin)
    } catch (e) {
      setError(
        (e as { code?: string }).code === 'terms-required'
          ? 'No account yet for that Google address. Please sign up first.'
          : friendlyAuthError(e),
      )
    }
  }

  async function handleReset() {
    setError(null)
    if (!email) {
      setError('Type your email above, then tap “Forgot password?” again.')
      return
    }
    try {
      await sendPasswordReset(email)
      setNotice('If there’s an account with that email, a reset link is on its way.')
    } catch (e) {
      setError(friendlyAuthError(e))
    }
  }

  return (
    <Screen centered maxWidth={420}>
      <Stack gap={1}>
        <AppText variant="title" center>
          {ROLE_APPS[appRole].appName}
        </AppText>
        <AppText variant="small" center>
          Click it. Get it.
        </AppText>
      </Stack>

      <Card>
        <AppText variant="heading">Log in</AppText>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={handleLogin}
        />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {notice ? <Notice tone="success">{notice}</Notice> : null}
        <Button label="Log in" onPress={handleLogin} loading={busy} />
        {Platform.OS === 'web' ? <Button label="Continue with Google" variant="secondary" onPress={handleGoogle} /> : null}
        <Button label="Forgot password?" variant="ghost" onPress={handleReset} />
      </Card>

      {canSignUp ? (
        <AppText variant="small" center>
          New here?{' '}
          <Link href={withNext('/register', afterLogin)} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>
            Create an account
          </Link>
        </AppText>
      ) : null}
    </Screen>
  )
}
