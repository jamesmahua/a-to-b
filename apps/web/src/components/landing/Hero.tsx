'use client'
import { useState } from 'react'

export default function Hero() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire up to Firebase or email service
    setSubmitted(true)
    setEmail('')
  }

  return (
    <section style={{
      background: 'linear-gradient(135deg, var(--brand-primary-light) 0%, #FED7AA 100%)',
      padding: 'var(--space-20) var(--space-6)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 'var(--max-width-narrow)', margin: '0 auto' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          backgroundColor: 'var(--brand-primary)',
          color: 'white',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semi)',
          letterSpacing: '0.1em',
          padding: 'var(--space-1) var(--space-4)',
          borderRadius: 'var(--radius-full)',
          marginBottom: 'var(--space-6)',
          textTransform: 'uppercase',
        }}>
          🇿🇦 Launching in South Africa
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-900)',
          lineHeight: 1.2,
          marginBottom: 'var(--space-6)',
        }}>
          Delivery Made Simple.{' '}
          <span style={{ color: 'var(--brand-primary)' }}>
            Built for Our Communities.
          </span>
        </h1>

        <p style={{
          fontSize: 'var(--text-xl)',
          color: 'var(--color-gray-600)',
          marginBottom: 'var(--space-10)',
          lineHeight: 1.7,
        }}>
          Order from your favourite local stores and get it delivered to your door.
          Supporting local businesses, one delivery at a time.
        </p>

        {submitted ? (
          <div style={{
            backgroundColor: 'var(--color-success)',
            color: 'white',
            padding: 'var(--space-4) var(--space-8)',
            borderRadius: 'var(--radius-full)',
            display: 'inline-block',
            fontWeight: 'var(--font-semi)',
          }}>
            ✓ You're on the list! We'll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: 'var(--space-3)',
            maxWidth: 440,
            margin: '0 auto',
          }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                flex: 1,
                padding: 'var(--space-3) var(--space-5)',
                borderRadius: 'var(--radius-full)',
                border: '2px solid var(--color-gray-200)',
                fontSize: 'var(--text-base)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-3) var(--space-8)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-semi)',
                whiteSpace: 'nowrap',
              }}
            >
              Notify Me
            </button>
          </form>
        )}
      </div>
    </section>
  )
}