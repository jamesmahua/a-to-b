'use client'
import { useState } from 'react'

export default function CTA() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire up to Firebase
    setSubmitted(true)
    setEmail('')
  }

  return (
    <section style={{
      backgroundColor: 'var(--color-white)',
      padding: 'var(--space-20) var(--space-6)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 'var(--max-width-narrow)', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'var(--text-4xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-900)',
          marginBottom: 'var(--space-5)',
        }}>
          Ready to Experience Simple Delivery?
        </h2>
        <p style={{
          fontSize: 'var(--text-xl)',
          color: 'var(--color-gray-500)',
          marginBottom: 'var(--space-8)',
        }}>
          Be among the first to try A to B when we launch.
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
            ✓ You're on the list!
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
              placeholder="Your email address"
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
            <button type="submit" style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-3) var(--space-8)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semi)',
              whiteSpace: 'nowrap',
            }}>
              Get Early Access
            </button>
          </form>
        )}
      </div>
    </section>
  )
}