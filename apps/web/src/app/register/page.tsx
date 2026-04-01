'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await register(email, password, displayName)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
      router.push('/dashboard')
    } catch {
      setError('Google sign-in failed. Please try again.')
    }
  }

  const inputStyle = {
    width: '100%', marginTop: 'var(--space-1)',
    padding: 'var(--space-3) var(--space-4)',
    border: '2px solid var(--color-gray-200)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)', outline: 'none',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--brand-primary-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-10)',
        width: '100%', maxWidth: 420,
        boxShadow: 'var(--shadow-lg)',
      }}>
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
            Create your account
          </h1>
          <p style={{ color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
            Join A to B today
          </p>
        </div>

        <button onClick={handleGoogle} style={{
          width: '100%', padding: 'var(--space-3)',
          border: '2px solid var(--color-gray-200)',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'white',
          fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)',
          marginBottom: 'var(--space-5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
        }}>
          <span style={{ fontSize: 18 }}>G</span> Continue with Google
        </button>

        <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
          or register with email
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-gray-700)' }}>Full name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-gray-700)' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-gray-700)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-gray-700)' }}>Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required style={inputStyle} />
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            backgroundColor: 'var(--brand-primary)',
            color: 'white', border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: 'var(--space-3)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-semi)',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 'var(--font-semi)' }}>
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}