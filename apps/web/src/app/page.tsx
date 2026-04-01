import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/Features'
import Stats from '@/components/landing/Stats'
import CTA from '@/components/landing/CTA'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <HowItWorks />
      <Features />
      <Stats />
      <CTA />
      <Footer />
    </main>
  )
}