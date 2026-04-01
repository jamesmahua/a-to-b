const steps = [
  {
    emoji: '📱',
    title: '1. Browse & Order',
    description: 'Select from local stores, add items to your cart, and checkout in seconds.',
  },
  {
    emoji: '📍',
    title: '2. Track in Real-Time',
    description: 'Watch your order journey from store to your doorstep with live GPS tracking.',
  },
  {
    emoji: '🚚',
    title: '3. Receive & Enjoy',
    description: 'Get your order delivered fast and fresh, with WhatsApp updates every step of the way.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{
      backgroundColor: 'var(--color-white)',
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
          How It Works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-8)',
        }}>
          {steps.map((step) => (
            <div key={step.title} style={{ textAlign: 'center' }}>
              <div style={{
                width: 72,
                height: 72,
                backgroundColor: 'var(--brand-primary-light)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-5)',
                fontSize: 32,
              }}>
                {step.emoji}
              </div>
              <h3 style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-semi)',
                color: 'var(--color-gray-900)',
                marginBottom: 'var(--space-3)',
              }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--color-gray-500)', lineHeight: 1.7 }}>
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}