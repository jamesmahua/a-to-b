import { useState } from 'react'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { ROLE_APPS, ROLE_LABELS } from '@repo/types'
import { friendlyAuthError, useAuth } from '@repo/firebase'
import { safeNextPath, withNext } from './RequireRole'
import { AppText, Button, Card, Checkbox, Notice, Screen, Stack, TextField } from '@repo/ui'

/**
 * Sign-up. The app decides the role: signing up in the driver app makes a driver
 * account, and so on. Super admins can't sign up (seed script or another super admin).
 */
export function RegisterScreen() {
  const { appRole, signUp } = useAuth()
  const router = useRouter()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const afterLogin = safeNextPath(next)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (appRole === 'super_admin') {
    return (
      <Screen centered maxWidth={420}>
        <Notice>Super admin accounts are set up by another super admin.</Notice>
        <Link href={withNext('/login', afterLogin)}>Back to log in</Link>
      </Screen>
    )
  }

  async function handleRegister() {
    setError(null)
    if (!displayName.trim()) return setError('Please enter your name.')
    if (!email.trim()) return setError('Please enter your email.')
    if (password.length < 6) return setError('Please use a password with at least 6 characters.')
    if (password !== confirm) return setError('The two passwords don’t match.')
    if (!acceptedTerms) return setError('Please accept the terms and privacy notice to continue.')
    setBusy(true)
    try {
      await signUp({
        email,
        password,
        displayName,
        phone: phone.trim() || null,
        acceptedTerms,
        marketingOptIn,
      })
      router.replace(afterLogin)
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen centered maxWidth={420}>
      <Stack gap={1}>
        <AppText variant="title" center>
          {ROLE_APPS[appRole].appName}
        </AppText>
        <AppText variant="small" center>
          Create your {ROLE_LABELS[appRole].toLowerCase()} account
        </AppText>
      </Stack>

      <Card>
        <TextField label="Full name" value={displayName} onChangeText={setDisplayName} autoComplete="name" />
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
          label="Cellphone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          hint="So we can SMS you about orders."
        />
        <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />

        <Checkbox
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          label="I accept the Klick&Kolleka terms and privacy notice."
        />
        <Checkbox
          checked={marketingOptIn}
          onChange={setMarketingOptIn}
          label="Send me specials and news (you can stop these any time)."
        />

        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button label="Create account" onPress={handleRegister} loading={busy} />
      </Card>

      <AppText variant="small" center>
        Already have an account?{' '}
        <Link href={withNext('/login', afterLogin)} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>
          Log in
        </Link>
      </AppText>
    </Screen>
  )
}
