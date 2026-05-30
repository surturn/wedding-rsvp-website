import type { Metadata } from 'next'
import { Playfair_Display, Lato } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { FloatingBotanicalsBackground } from '@/components/florals'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-serif',
  display: 'swap',
})

const lato = Lato({ 
  subsets: ["latin"],
  weight: ['300', '400', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://manuandanne.love'),
  title: 'Manuh & Anne | Wedding Celebration',
  description: 'Join us in celebrating the union of Manuscripts and Anne James. Two hearts, one love, speaking in words and signs.',
  openGraph: {
    title: 'Manuh & Anne | Wedding Celebration',
    description: 'A love story written by God — September 5, 2026',
    type: 'website',
    images: [
      {
        url: '/images/couple.jpg',
        width: 800,
        height: 800,
        alt: 'Manuh & Anne — A love story written by God',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manuh & Anne | Wedding Celebration',
    description: 'A love story written by God — September 5, 2026',
    images: ['/images/couple.jpg'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} bg-cream`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        {/* Grain texture overlay for rustic paper feel */}
        <div className="grain-overlay" aria-hidden="true" />
        {/* Floating botanical background decorations */}
        <FloatingBotanicalsBackground />
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
