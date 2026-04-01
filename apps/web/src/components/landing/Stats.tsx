const stats = [
  { value: 'Coming Soon', label: 'Partner Stores' },
  { value: 'Join Us', label: 'Active Drivers' },
  { value: 'Be First', label: 'Happy Customers' },
]

export default function Stats() {
  return (
    <section style={{
      backgroundColor: 'var(--brand-primary)',
      padding: 'var(--space-16) var(--space-6)',
    }}>
      <div style={{
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-8)',
        textAlign: 'center',
      }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{
              fontSize: 'var(--text-4xl)',
              fontWeight: 'var(--font-bold)',
              color: 'white',
              marginBottom: 'var(--space-2)',
            }}>
              {s.value}
            </div>
            <div style={{ color: '#FED7AA', fontSize: 'var(--text-base)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}