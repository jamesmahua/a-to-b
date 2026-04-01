export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--color-gray-900)',
      color: 'var(--color-gray-400)',
      padding: 'var(--space-10) var(--space-6)',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-4)',
        }}>
          <div style={{
            width: 32,
            height: 32,
            backgroundColor: 'var(--brand-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xs)' }}>
              A|B
            </span>
          </div>
          <span style={{ color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)' }}>
            AIIB
          </span>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
          A to B — Making delivery accessible to everyone
        </p>
        <p style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-4)' }}>
          © 2026 A to B. Built with passion in South Africa 🇿🇦
        </p>
      </div>
    </footer>
  )
}