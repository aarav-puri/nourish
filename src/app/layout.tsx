import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

/**
 * Manrope carries the display voice, Inter the reading voice. The data voice
 * uses the system monospace stack, so it costs no download at all.
 *
 * Both are self hosted by next/font: no render blocking request to Google,
 * display swap so text is never invisible, and a size adjusted fallback so
 * the swap costs no layout shift.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'BarcodeSense | Know what is in your food',
  description:
    'Scan any barcode to see what is really in a product: ingredients explained in plain English, nutrition, diet compatibility, environmental impact, and a healthier alternative.',
  // One source for every icon: favicon.png is the full resolution mark, so
  // each surface downsamples from it rather than from a small baked copy.
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // No maximumScale / userScalable: pinch-zoom stays available.
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0A0A0A',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '14px',
              color: '#FFFFFF',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
