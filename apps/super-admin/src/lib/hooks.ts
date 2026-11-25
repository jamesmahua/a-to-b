import { useEffect, useState } from 'react'

/**
 * The current time, refreshed every `everyMs` (default 30 s), so "waiting 4 min"
 * and the red cards keep updating without anyone touching the screen.
 */
export function useNow(everyMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), everyMs)
    return () => clearInterval(timer)
  }, [everyMs])
  return now
}
