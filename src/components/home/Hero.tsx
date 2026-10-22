'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import SculptureHero from '@/components/ui/liquid-sculpture-hero'

export default function Hero() {
  const { user } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setTheme(media.matches ? 'dark' : 'light')
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (!theme) return <section aria-hidden="true" className="nourish-sculpture-placeholder" />

  return (
    <SculptureHero
      src="/sculpture/light.webp"
      darkSrc="/sculpture/dark.webp"
      mobileSrc="/sculpture/light.webp"
      mobileDarkSrc="/sculpture/dark.webp"
      showNav={false}
      themeToggle={false}
      theme={theme}
      background="#f7f8f2"
      darkBackground="#101b16"
      textColor="rgb(var(--ink))"
      accentColor="rgb(var(--accent-ink))"
      headingFont="var(--font-display), sans-serif"
      bodyFont="var(--font-sans), sans-serif"
      accentFont="Georgia, 'Times New Roman', serif"
      loadFonts={false}
      eyebrow=""
      headline={'Good food.\nInformed choices.'}
      headlineAccent="Informed choices."
      body="Scan a barcode. Understand your food."
      primaryCta={{ label: user ? 'Open scanner' : 'Scan your first product', href: '/app' }}
      secondaryCta={{ label: 'How it works', href: '#how' }}
      backdropText="nourish"
      hint=""
      hintTouch=""
      height="max(740px, calc(100svh - 80px))"
      particleDensity={0.65}
      showCredit={false}
      className="nourish-sculpture"
    />
  )
}
