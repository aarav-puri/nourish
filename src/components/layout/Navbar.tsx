'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Wordmark from '@/components/brand/Wordmark'

const NAV = [
  { href: '/#how', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const cta = user ? 'Go to dashboard' : 'Sign in'

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow] duration-200 ${
        scrolled || open
          ? 'bg-paper/85 shadow-[0_8px_16px_-12px_rgb(var(--sh-dark)/var(--sh-dark-a))] backdrop-blur-md'
          : 'bg-paper'
      }`}
    >
      <nav aria-label="Primary" className="relative flex h-20 max-w-[84rem] mx-auto items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" aria-label="Nourish home" className="rounded-md">
          <Wordmark byline />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {NAV.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname === l.href ? 'page' : undefined}
                className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-ink/[0.04] hover:text-ink aria-[current=page]:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="btn-icon md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
          <div className="flex items-center" aria-busy={loading || undefined}>
            <Link href={user ? '/app' : '/signin'} className="btn-primary h-11 min-h-11 rounded-full px-5 sm:px-6">
              {loading ? 'Get started' : cta}
            </Link>
          </div>
        </div>
      </nav>

      <div id="mobile-nav" hidden={!open} className="fixed inset-x-0 bottom-0 top-20 z-40 flex flex-col bg-paper md:hidden">
        <ul className="flex-1 px-[var(--gutter)] pt-2">
          {NAV.map((l, i) => (
            <li key={l.href} className="animate-rise border-b border-line" style={{ animationDelay: `${i * 40}ms` }}>
              <Link href={l.href} onClick={() => setOpen(false)} className="flex h-14 items-center font-display font-bold text-2xl">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
