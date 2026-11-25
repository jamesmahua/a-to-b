import { Slot } from 'expo-router'
import { RequireRole } from '@repo/app-shell'

/** Everything inside (app)/ needs a logged-in customer. */
export default function ProtectedLayout() {
  return (
    <RequireRole>
      <Slot />
    </RequireRole>
  )
}
