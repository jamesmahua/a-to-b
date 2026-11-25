import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { onSnapshot } from 'firebase/firestore'
import { ROLE_APPS, type Role, type UserProfile } from '@repo/types'
import { getAuthInstance } from './app'
import { signUpWithEmail, type SignUpInput } from './auth'
import { userRef } from './refs'

/**
 * Where the person stands, from this app's point of view.
 *  loading     – still checking
 *  signed_out  – show login
 *  allowed     – right role for this app
 *  wrong_app   – logged in, but their role belongs to a different app
 *  no_profile  – logged in but users/{uid} is missing (shouldn't happen; offer sign-out)
 */
export type AccessStatus = 'loading' | 'signed_out' | 'allowed' | 'wrong_app' | 'no_profile'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  /** True until we know whether someone is logged in and have their profile. */
  loading: boolean
  /** The role this app is for. */
  appRole: Role
  access: AccessStatus
  /** For `wrong_app`: where their own app lives in the browser, e.g. "/store". */
  correctWebPath: string | null
  signUp: (input: Omit<SignUpInput, 'role'>) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

interface AuthProviderProps {
  /** Which role this app serves. Sign-ups in this app get this role. */
  appRole: Role
  children: ReactNode
}

export function AuthProvider({ appRole, children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)
  // While signing up, the account exists a moment before its profile does.
  const creatingAccount = useRef(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let stopProfile: (() => void) | undefined
    const stopAuth = onAuthStateChanged(getAuthInstance(), (firebaseUser) => {
      stopProfile?.()
      setUser(firebaseUser)
      setAuthChecked(true)
      if (!firebaseUser) {
        setProfile(null)
        setProfileChecked(true)
        return
      }
      setProfileChecked(false)
      // Live: if super admin changes their role or approves their store, the app updates.
      stopProfile = onSnapshot(
        userRef(firebaseUser.uid),
        (snap) => {
          if (!snap.exists() && creatingAccount.current) return // profile is on its way
          setProfile(snap.exists() ? snap.data() : null)
          setProfileChecked(true)
        },
        () => {
          setProfile(null)
          setProfileChecked(true)
        },
      )
    })
    return () => {
      stopProfile?.()
      stopAuth()
    }
  }, [])

  const signUp = useCallback(
    async (input: Omit<SignUpInput, 'role'>) => {
      if (appRole === 'super_admin') throw new Error('Super admin accounts are created by another super admin.')
      creatingAccount.current = true
      setCreating(true)
      try {
        await signUpWithEmail({ ...input, role: appRole })
      } finally {
        creatingAccount.current = false
        setCreating(false)
      }
    },
    [appRole],
  )

  const value = useMemo<AuthState>(() => {
    const loading = !authChecked || (!!user && !profileChecked) || creating
    let access: AccessStatus
    if (loading) access = 'loading'
    else if (!user) access = 'signed_out'
    else if (!profile) access = 'no_profile'
    else if (profile.role !== appRole) access = 'wrong_app'
    else access = 'allowed'

    return {
      user,
      profile,
      loading,
      appRole,
      access,
      correctWebPath: access === 'wrong_app' && profile ? ROLE_APPS[profile.role].webPath : null,
      signUp,
    }
  }, [authChecked, user, profileChecked, profile, creating, appRole, signUp])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
