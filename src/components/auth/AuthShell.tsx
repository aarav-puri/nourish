import Link from 'next/link'
import Image from 'next/image'
import { ReactNode } from 'react'

interface AuthShellProps {
  eyebrow: string
  title: string
  lede: string
  children: ReactNode
  /** The cross link to the other auth page. */
  footer: ReactNode
}

/**
 * The shared frame for the sign in and sign up pages, so the two read as one
 * flow rather than two screens that happen to look similar.
 */
export default function AuthShell({ eyebrow, title, lede, children, footer }: AuthShellProps) {
  return (
    <main
      id="main"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black px-[var(--gutter)] py-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.05] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(circle_at_center,black_35%,transparent_75%)]"
      />

      <div className="relative w-full max-w-[26rem]">
        <Link
          href="/"
          className="mb-10 flex items-center justify-center gap-2.5"
          aria-label="BarcodeSense home"
        >
          <Image src="/favicon.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-bold tracking-tight">BarcodeSense</span>
        </Link>

        <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-zinc-900 to-black p-7 shadow-2xl shadow-black/80 sm:p-9">
          {/* A hairline of light across the head, like a scan line at rest. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />

          <p className="text-xs font-bold uppercase tracking-label text-zinc-500">{eyebrow}</p>
          <h1 className="t-h3 mt-3">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{lede}</p>

          {children}
        </div>

        <div className="mt-6 text-center text-sm text-zinc-400">{footer}</div>
      </div>
    </main>
  )
}
