/**
 * Which suburb the customer is shopping for.
 *
 * No GPS in v1 (spec §10.4): the customer picks their suburb from a list, and
 * Home shows the stores that deliver there. The choice is kept on the device,
 * so it works before logging in. Once logged in, it's also saved on their
 * profile (`users/{uid}.suburbId`), so their other devices start there too.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { suburbsCol, useAuth, userRef } from '@repo/firebase'
import type { Suburb } from '@repo/types'

const STORAGE_KEY = 'kk.suburb.v1'

interface SuburbContextValue {
  suburbs: Suburb[]
  /** The chosen suburb, or null if they haven't picked one yet. */
  suburb: Suburb | null
  /** False until the list and the saved choice have loaded. */
  ready: boolean
  error: string | null
  setSuburb: (suburbId: string) => void
}

const SuburbContext = createContext<SuburbContextValue | null>(null)

export function SuburbProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const [suburbs, setSuburbs] = useState<Suburb[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listLoaded, setListLoaded] = useState(false)
  const [savedLoaded, setSavedLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The suburb list: small and rarely changes, so read it once (not live).
  useEffect(() => {
    getDocs(query(suburbsCol(), where('active', '==', true)))
      .then((snap) => setSuburbs(snap.docs.map((d) => d.data()).sort((a, b) => a.sort - b.sort)))
      .catch(() => setError('We couldn’t load the list of suburbs. Check your connection and try again.'))
      .finally(() => setListLoaded(true))
  }, [])

  // The choice saved on this device.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((id) => id && setSelectedId(id))
      .catch(() => {})
      .finally(() => setSavedLoaded(true))
  }, [])

  // Nothing chosen on this device yet, but their profile has a suburb: use that.
  useEffect(() => {
    if (savedLoaded && !selectedId && profile?.role === 'customer' && profile.suburbId) {
      setSelectedId(profile.suburbId)
    }
  }, [savedLoaded, selectedId, profile])

  const setSuburb = useCallback(
    (suburbId: string) => {
      setSelectedId(suburbId)
      AsyncStorage.setItem(STORAGE_KEY, suburbId).catch(() => {})
      // Logged-in customers: remember it on their profile too. Not critical, so a failure is ignored.
      if (user && profile?.role === 'customer' && profile.suburbId !== suburbId) {
        updateDoc(userRef(user.uid), { suburbId, updatedAt: serverTimestamp() }).catch(() => {})
      }
    },
    [user, profile],
  )

  const value = useMemo<SuburbContextValue>(
    () => ({
      suburbs,
      suburb: suburbs.find((s) => s.id === selectedId) ?? null,
      ready: listLoaded && savedLoaded,
      error,
      setSuburb,
    }),
    [suburbs, selectedId, listLoaded, savedLoaded, error, setSuburb],
  )

  return <SuburbContext.Provider value={value}>{children}</SuburbContext.Provider>
}

export function useSuburb(): SuburbContextValue {
  const ctx = useContext(SuburbContext)
  if (!ctx) throw new Error('useSuburb must be used inside <SuburbProvider>')
  return ctx
}
