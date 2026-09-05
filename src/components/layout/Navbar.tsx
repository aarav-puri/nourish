'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const NAV = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

/**
 * A floating capsule rather than a full width bar: it reads as a control
 * resting on the page. It tightens and darkens once the page has moved, and
 * the hairline under it fills as a read progress indicator.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const { user, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      // Read layout once per frame rather than once per scroll event.
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        const max = document.documentElement.scrollHeight - window.innerHeight
        setScrolled(y > 24)
        setProgress(max > 0 ? Math.min(1, y / max) : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => setOpen(false), [pathname])

  // Lock the page behind the open panel, and let Escape close it.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:pt-6">
        <nav
          aria-label="Primary"
          className={`mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border px-4 py-2.5 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-[260ms] ease-scan sm:px-5 ${
            scrolled
              ? 'border-white/15 bg-black/75 shadow-2xl shadow-black/60'
              : 'border-white/10 bg-black/45'
          }`}
        >
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="BarcodeSense home">
            <Image
              src="/favicon.png"
              alt=""
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />
            <span className="font-display text-base font-bold tracking-tight">BarcodeSense</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? 'page' : undefined}
                className={`relative inline-flex min-h-[2.25rem] items-center text-sm font-medium transition-colors duration-[120ms] ${
                  pathname === l.href ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {l.label}
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 left-0 h-px w-full bg-white transition-transform duration-[260ms] ease-scan ${
                    pathname === l.href ? 'scale-x-100' : 'scale-x-0'
                  } origin-left`}
                />
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {loading ? (
              <div className="h-11 w-28" />
            ) : (
              <>
                {!user && (
                  <Link
                    href="/signin"
                    className="hidden min-h-[2.25rem] items-center px-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white md:inline-flex"
                  >
                    Sign in
                  </Link>
                )}

                {/* A conic sweep runs the border on hover: the same gesture as
                    the lead call to action, at a quieter volume. */}
                <Link
                  href="/app"
                  className="group relative hidden min-h-11 items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 transition-transform duration-[120ms] active:scale-95 md:inline-flex"
                >
                  <span aria-hidden="true" className="absolute inset-0 rounded-full border border-white/10" />
                  <span
                    aria-hidden="true"
                    className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ffffff_100%)] opacity-0 transition-opacity duration-[260ms] group-hover:opacity-100 motion-reduce:animate-none"
                  />
                  <span aria-hidden="true" className="absolute inset-[1px] rounded-full bg-black" />
                  <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-label">
                    {user ? 'Open scanner' : 'Start scanning'}
                    <ArrowRight
                      className="h-3 w-3 transition-transform duration-[120ms] group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="btn-icon md:hidden"
            >
              <span aria-hidden="true" className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-[260ms] ease-scan ${
                    open ? 'top-[7px] rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-[1.5px] w-full rounded-full bg-current transition-opacity duration-[120ms] ${
                    open ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-transform duration-[260ms] ease-scan ${
                    open ? 'top-[7px] -rotate-45' : 'top-[14px]'
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>

        {/* Read progress, hung under the capsule. */}
        <div aria-hidden="true" className="mx-auto mt-2 h-px max-w-5xl overflow-hidden bg-white/10">
          <div
            className="h-full bg-white/70 transition-[width] duration-150 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </header>

      {/* Mobile panel: a full sheet with staggered entries, not a dropdown. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-40 flex flex-col bg-black/95 pt-28 backdrop-blur-xl md:hidden"
      >
        <nav aria-label="Primary" className="flex flex-1 flex-col justify-center gap-1 px-[var(--gutter)]">
          {NAV.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="group flex items-baseline gap-4 border-b border-white/10 py-5"
              style={{
                animation: open ? `slide-up 380ms cubic-bezier(0.16,1,0.3,1) ${i * 55}ms both` : undefined,
              }}
            >
              <span className="text-xs font-bold tracking-label text-zinc-500">0{i + 1}</span>
              <span className="font-display text-2xl font-semibold tracking-tight transition-colors duration-[120ms] group-hover:text-zinc-300">
                {l.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3 px-[var(--gutter)] pb-[max(2rem,env(safe-area-inset-bottom))]">
          {!user && !loading && (
            <Link href="/signin" onClick={() => setOpen(false)} className="btn-secondary w-full">
              Sign in
            </Link>
          )}
          <Link href="/app" onClick={() => setOpen(false)} className="btn-primary w-full">
            {user ? 'Open scanner' : 'Start scanning'}
          </Link>
        </div>
      </div>
    </>
  )
}
