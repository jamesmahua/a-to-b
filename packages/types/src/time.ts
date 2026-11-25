import type { TimestampLike } from './common'

/** Whole minutes since a timestamp. `null` while the server time hasn't arrived yet. */
export function minutesSince(ts: TimestampLike | null, now: Date): number | null {
  if (!ts) return null
  return Math.max(0, Math.floor((now.getTime() - ts.toDate().getTime()) / 60000))
}

/** "Just now", "4 min", "1 h 05 min" */
export function formatWaiting(minutes: number | null): string {
  if (minutes === null || minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h} h ${m.toString().padStart(2, '0')} min`
}
