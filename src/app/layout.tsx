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
    default: 'Nourish | The fine print, made clear',
    template: '%s · Nourish',
  },
  description:
    'Scan any food barcode to see its health score out of 100, how processed it is, and every additive and allergen clearly explained, checked against your diet. Free, with no ads.',
  applicationName: 'Nourish',
  icons: {
    icon: [
      { url: '/brand/mark.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
      { url: '/icons/apple-touch-icon-167.png', sizes: '167x167' },
      { url: '/icons/apple-touch-icon-152.png', sizes: '152x152' },
      { url: '/icons/apple-touch-icon-120.png', sizes: '120x120' },
    ],
  },
  appleWebApp: { title: 'Nourish', statusBarStyle: 'default' },
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
