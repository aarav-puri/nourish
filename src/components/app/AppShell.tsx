'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { History, LogOut, ScanLine, Settings, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/supabase'
import Wordmark from '@/components/brand/Wordmark'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/app', label: 'Scan', icon: ScanLine },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

// Set while signing out, so the guard below does not bounce to /signin on the
// way to the home page.
let signingOut = false

/**
 * The frame for every signed-in screen: one header, the same three
 * destinations everywhere (tabs on desktop, a thumb-reach tab bar on phones),
 * and the sign-in guard so no page has to repeat it.
 */
export default function AppShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  const { user, loading, requireSignIn } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user && !signingOut) requireSignIn()
  }, [loading, user, requireSignIn])

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-ink-3">
        <Spinner className="h-5 w-5" label="Loading" />
      </div>
    )
  }

  const width = wide ? 'max-w-5xl' : 'max-w-3xl'

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-40 bg-paper/85 shadow-[0_8px_16px_-12px_rgb(var(--sh-dark)/var(--sh-dark-a))] backdrop-blur-md supports-[backdrop-filter]:bg-paper/75">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-[var(--gutter)]">
          <Link href="/" aria-label="Nourish home" className="-m-1 rounded-md p-1">
            <Wordmark byline />
          </Link>

          <nav aria-label="App" className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => {
              const active = pathname === t.href
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                    active ? 'bg-ink/[0.07] text-ink' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink'
                  }`}
                >
                  <t.icon className="h-4 w-4" aria-hidden="true" />
                  {t.label}
                </Link>
              )
            })}
            <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />
            <AccountMenu user={user} />
          </nav>

          <div className="md:hidden">
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      <main id="main" className={`mx-auto ${width} px-[var(--gutter)] pb-16 pt-6 sm:pt-10`}>
        {children}
      </main>

      {/* Phone tab bar: the three destinations within thumb reach. */}
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-40 bg-paper/90 shadow-[0_-8px_16px_-12px_rgb(var(--sh-dark)/var(--sh-dark-a))] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map((t) => {
            const active = pathname === t.href
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                    active ? 'text-ink' : 'text-ink-3'
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                      active ? 'text-accent-ink shadow-neu-inset-sm' : ''
                    }`}
                  >
                    <t.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  {t.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

function AccountMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const signOut = async () => {
    setOpen(false)
    signingOut = true
    try {
      await auth.signOut()
      router.replace('/')
    } catch {
      toast.error('Could not sign out. Try again.')
    } finally {
      setTimeout(() => (signingOut = false), 1000)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account"
        className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-ink/[0.05]"
      >
        <Avatar user={user} size={30} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-64 animate-rise overflow-hidden rounded-3xl bg-paper py-2 shadow-neu"
        >
          <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
            <Avatar user={user} size={34} />
            <div className="min-w-0">
              <p className="text-xs text-ink-3">Signed in as</p>
              <p className="truncate text-sm font-medium">{user.email}</p>
            </div>
          </div>
          <div className="py-1">
            <Link
              role="menuitem"
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center gap-3 px-3.5 text-sm text-ink-2 hover:bg-ink/[0.04] hover:text-ink"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={signOut}
              className="flex h-10 w-full items-center gap-3 px-3.5 text-sm text-ink-2 hover:bg-ink/[0.04] hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
