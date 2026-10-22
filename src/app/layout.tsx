import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import Toaster from '@/components/ui/Toaster'
import './globals.css'

/**
 * DM Sans carries the interface, Plus Jakarta Sans the headlines, and Geist
 * Mono the data (barcodes, grams, scores). All three are self-hosted by
 * next/font.
 */
const sans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
})
const geistMono = Geist_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: {
    default: 'Nourish: know what is in your food',
    template: '%s · Nourish',
  },
  description:
    'Scan any food barcode to see its grade, sugar, additives and allergens, checked against your own diet. Free, with no ads.',
  applicationName: 'Nourish',
  verification: {
    google: '9_JzOdfOk3oOJkfW-pZ7t_XjlRBABpYdauzpEX9h1i0',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8f2' },
    { media: '(prefers-color-scheme: dark)', color: '#101b16' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
