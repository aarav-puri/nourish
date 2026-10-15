import Link from 'next/link'
import Wordmark from '@/components/brand/Wordmark'

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col px-[var(--gutter)] py-6">
      <Link href="/" aria-label="Nourish home" className="self-start rounded-md">
        <Wordmark />
      </Link>
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
        {/* A barcode with nothing to read. */}
        <div aria-hidden="true" className="flex h-16 items-stretch gap-[3px] opacity-25">
          {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 3, 2, 1, 4, 1, 2].map((w, i) => (
            <span key={i} className="bg-ink" style={{ width: w * 2 }} />
          ))}
        </div>
        <p className="mt-6 font-mono text-sm text-ink-3">404</p>
        <h1 className="t-title mt-2">Nothing scans here.</h1>
        <p className="mt-3 leading-relaxed text-ink-2">This page may have moved, or the link may be mistyped.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/app" className="btn-primary">
            Open the scanner
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
