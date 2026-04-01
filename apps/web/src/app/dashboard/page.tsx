'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { user, profile, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--color-gray-500)' }}>Loading...</p>
    </div>
  )

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-50)', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64,
            backgroundColor: 'var(--brand-primary)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            fontSize: 'var(--text-2xl)', color: 'white', fontWeight: 'var(--font-bold)',
          }}>
            {profile?.displayName?.[0]?.toUpperCase() || '?'}
          </div>

          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-gray-900)' }}>
            Welcome, {profile?.displayName || 'there'}!
          </h1>
          <p style={{ color: 'var(--color-gray-500)', marginTop: 'var(--space-2)' }}>
            {profile?.email}
          </p>

          <div style={{
            display: 'inline-block',
            backgroundColor: 'var(--brand-primary-light)',
            color: 'var(--brand-primary)',
            padding: 'var(--space-1) var(--space-4)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semi)',
            marginTop: 'var(--space-3)',
            textTransform: 'capitalize',
          }}>
            {profile?.role || 'customer'}
          </div>

          <p style={{ color: 'var(--color-gray-400)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-6)' }}>
            🚧 Customer app coming next session
          </p>

          <button onClick={async () => { await logout(); router.push('/') }} style={{
            marginTop: 'var(--space-6)',
            backgroundColor: 'transparent',
            border: '2px solid var(--color-gray-200)',
            borderRadius: 'var(--radius-full)',
            padding: 'var(--space-2) var(--space-8)',
            color: 'var(--color-gray-600)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            cursor: 'pointer',
          }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}