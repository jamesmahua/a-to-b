'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, resetPassword } = useAuth()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await loginWithGoogle()
      router.push('/dashboard')
    } catch (err: any) {
      setError('Google sign-in failed. Please try again.')
    }
  }

  const handleReset = async () => {
    if (!email) { setError('Enter your email above first.'); return }
    await resetPassword(email)
    setResetSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--brand-primary-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-10)',
        width: '100%',
        maxWidth: 420,
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 48, height: 48,
            backgroundColor: 'var(--brand-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-3)',
          }}>
            <span style={{ color: 'white', fontWeight: 'var(--font-bold)' }}>A|B</span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-gray-900)' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
            Sign in to your A to B account
          </p>
        </div>

        {/* Google */}
        <button onClick={handleGoogle} style={{
          width: '100%', padding: 'var(--space-3)',
          border: '2px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'white',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
        }}>
          <span style={{ fontSize: 18 }}>G</span> Continue with Google
        </button>

        <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
          or sign in with email
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-gray-700)' }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{
                width: '100%', marginTop: 'var(--space-1)',
                padding: 'var(--space-3) var(--space-4)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)', outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-gray-700)' }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{
                width: '100%', marginTop: 'var(--space-1)',
                padding: 'var(--space-3) var(--space-4)',
                border: '2px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)', outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {resetSent && (
            <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              Password reset email sent — check your inbox.
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            backgroundColor: 'var(--brand-primary)',
            color: 'white', border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: 'var(--space-3)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semi)',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
          <button onClick={handleReset} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}>
            Forgot password?
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
          Don't have an account?{' '}
          <a href="/register" style={{ color: 'var(--brand-primary)', fontWeight: 'var(--font-semi)' }}>
            Sign up
          </a>
        </div>
      </div>
    </div>
  )
}