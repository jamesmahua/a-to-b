import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../../../../packages/ui/globals.css'
import './globals-tailwind.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'A to B — Simple Delivery, Built for Our Communities',
  description: 'Order from your favourite local stores and get it delivered to your door. Supporting local businesses across South Africa.',
  keywords: 'delivery, South Africa, local stores, food delivery, grocery delivery',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}