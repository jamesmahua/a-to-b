import { useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { signOut, useAuth } from '@repo/firebase'
import { VERTICALS, VERTICAL_LABELS, type Vertical } from '@repo/types'
import { AppText, Button, Card, ChipTabs, Notice, Screen, Stack, theme, type ChipOption } from '@repo/ui'
import { CartBar } from '../components/CartBar'
import { StoreCard } from '../components/StoreCard'
import { SuburbSheet } from '../components/SuburbSheet'
import { TopBar, TopBarButton } from '../components/TopBar'
import { useStoresForSuburb } from '../lib/catalogue'
import { useSuburb } from '../lib/suburb'

type Filter = 'all' | Vertical

/** Home: pick a suburb, filter by type, see the stores that deliver there. Works before logging in. */
export default function Home() {
  const router = useRouter()
  const { profile, access } = useAuth()
  const { suburb, ready } = useSuburb()
  const stores = useStoresForSuburb(suburb?.id ?? null)
  const [filter, setFilter] = useState<Filter>('all')
  const [pickingSuburb, setPickingSuburb] = useState(false)

  // Only offer the types that some store here actually sells.
  const filters = useMemo<ChipOption<Filter>[]>(() => {
    const present = new Set(stores.data.map((s) => s.vertical))
    return [
      { value: 'all', label: 'All' },
      ...VERTICALS.filter((v) => present.has(v)).map((v) => ({ value: v, label: VERTICAL_LABELS[v] })),
    ]
  }, [stores.data])

  // Open stores first, then A–Z (the query already sorted A–Z; sort is stable).
  const shown = stores.data
    .filter((s) => filter === 'all' || s.vertical === filter)
    .sort((a, b) => Number(b.tradingStatus === 'open') - Number(a.tradingStatus === 'open'))

  const signedIn = access === 'allowed'

  return (
    <View style={{ flex: 1 }}>
      <TopBar
        title="Klick&Kolleka"
        right={
          <>
            <TopBarButton label="Search" onPress={() => router.push('/search')} />
            {signedIn ? (
              <TopBarButton label="Log out" onPress={() => signOut()} />
            ) : (
              <TopBarButton label="Log in" onPress={() => router.push('/login')} />
            )}
          </>
        }
      >
        <TopBarButton
          label={suburb ? `Delivering to ${suburb.name} ▾` : 'Choose your suburb ▾'}
          accessibilityLabel={suburb ? `Delivering to ${suburb.name}. Change suburb` : 'Choose your suburb'}
          onPress={() => setPickingSuburb(true)}
        />
      </TopBar>

      <Screen>
        {signedIn && profile ? <AppText variant="title">Hi {profile.firstName} 👋</AppText> : null}

        {!ready ? (
          <ActivityIndicator color={theme.color.textStrong} />
        ) : !suburb ? (
          <Card>
            <AppText variant="heading">Where are you?</AppText>
            <AppText>Choose your suburb and we’ll show you the stores that deliver there.</AppText>
            <Button label="Choose suburb" onPress={() => setPickingSuburb(true)} />
          </Card>
        ) : (
          <Stack gap={4}>
            {filters.length > 2 ? (
              <ChipTabs options={filters} value={filter} onChange={setFilter} accessibilityLabel="Filter stores by type" />
            ) : null}

            {stores.error ? <Notice tone="danger">{stores.error}</Notice> : null}
            {stores.loading ? <ActivityIndicator color={theme.color.textStrong} /> : null}

            {!stores.loading && !stores.error && shown.length === 0 ? (
              <Card>
                <AppText variant="heading">No stores here yet</AppText>
                <AppText>
                  We don’t have stores delivering to {suburb.name} yet. Try a nearby suburb. We’re adding more every week.
                </AppText>
              </Card>
            ) : null}

            {shown.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </Stack>
        )}
      </Screen>

      <CartBar />
      <SuburbSheet visible={pickingSuburb} onClose={() => setPickingSuburb(false)} />
    </View>
  )
}
