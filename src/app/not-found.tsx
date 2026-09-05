import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      id="main"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black px-[var(--gutter)] text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.04] blur-[120px]"
      />

      {/* An unreadable strip: nothing here to decode. */}
      <div aria-hidden="true" className="relative mb-10 flex h-16 items-end gap-[3px]">
        {[14, 40, 22, 58, 30, 46, 18, 62, 26, 38, 52, 20].map((h, i) => (
          <span key={i} className="w-[3px] rounded-full bg-white/20" style={{ height: `${h}px` }} />
        ))}
      </div>

      <p className="relative text-xs font-bold uppercase tracking-label text-zinc-500">Error 404</p>
      <h1 className="t-h2 relative mt-5">No read</h1>
      <p className="relative mt-5 max-w-sm leading-relaxed text-zinc-400">
        There is nothing at this address to decode. The page may have moved, or the link may be
        mistyped.
      </p>

      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/app" className="btn-secondary">
          Open scanner
        </Link>
      </div>
    </main>
  )
}
