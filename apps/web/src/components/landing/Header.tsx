'use client'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{
      backgroundColor: 'var(--color-white)',
      borderBottom: '1px solid var(--color-gray-200)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: 'var(--header-height)',
    }}>
      <div style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        padding: '0 var(--space-6)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 36,
            height: 36,
            backgroundColor: 'var(--brand-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)' }}>
              A|B
            </span>
          </div>
          <div>
            <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)', lineHeight: 1, color: 'var(--color-gray-900)' }}>
              AIIB
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-400)', letterSpacing: '0.08em' }}>
              A TO B
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <a href="#how-it-works" style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
            How it works
          </a>
          <a href="#features" style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>
            Features
          </a>
          <button style={{
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: 'var(--space-2) var(--space-6)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semi)',
          }}>
            Coming Soon
          </button>
        </nav>
      </div>
    </header>
  )
}