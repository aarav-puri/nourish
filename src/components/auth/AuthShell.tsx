import Link from 'next/link'
import { ReactNode } from 'react'
import Wordmark from '@/components/brand/Wordmark'

interface AuthShellProps {
  eyebrow: string
  title: string
  lede: string
  children: ReactNode
  /** The cross link to the other auth page. */
  footer: ReactNode
}

/**
 * The shared frame for sign in, sign up and password reset: the form on
 * paper, and on wide screens a reminder of what is on the other side.
 */
export default function AuthShell({ eyebrow, title, lede, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <main id="main" className="flex flex-col px-[var(--gutter)] py-6 sm:py-8">
        <Link href="/" aria-label="Nourish home" className="self-start rounded-md">
          <Wordmark />
        </Link>

        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-12">
          <p className="t-eyebrow">{eyebrow}</p>
          <h1 className="t-title mt-2">{title}</h1>
          <p className="mt-3 leading-relaxed text-ink-2">{lede}</p>
          {children}
          <div className="mt-8 text-sm text-ink-2">{footer}</div>
        </div>
      </main>

      <aside aria-hidden="true" className="relative m-4 hidden overflow-hidden rounded-3xl border border-accent/10 bg-accent-soft/60 lg:flex lg:items-center lg:justify-center">
        <div className="flex w-full max-w-sm flex-col items-center px-8 py-10">
          <p className="text-center font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-ink">
            Food choices that feel a little more <em className="not-italic text-accent-ink">you</em>.
          </p>
        </div>
      </aside>
    </div>
  )
}
