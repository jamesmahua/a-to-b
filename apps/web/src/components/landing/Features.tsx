const features = [
  {
    emoji: '📍',
    title: 'Live GPS Tracking',
    description: 'Know exactly where your driver is and when your order will arrive.',
  },
  {
    emoji: '💬',
    title: 'WhatsApp Updates',
    description: 'Get instant notifications about your order status right on WhatsApp.',
  },
  {
    emoji: '🏪',
    title: 'Support Local',
    description: 'Every order supports local businesses and creates jobs in your community.',
  },
  {
    emoji: '⚡',
    title: 'Fast & Reliable',
    description: 'Quick delivery times with professional drivers you can trust.',
  },
]

export default function Features() {
  return (
    <section id="features" style={{
      backgroundColor: 'var(--brand-primary-light)',
      padding: 'var(--space-20) var(--space-6)',
    }}>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-gray-900)',
          marginBottom: 'var(--space-12)',
        }}>
          Why Choose A to B?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          {features.map((f) => (
            <div key={f.title} style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              gap: 'var(--space-4)',
              alignItems: 'flex-start',
            }}>
              <div style={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--brand-primary-light)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
              }}>
                {f.emoji}
              </div>
              <div>
                <h3 style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semi)',
                  color: 'var(--color-gray-900)',
                  marginBottom: 'var(--space-2)',
                }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}