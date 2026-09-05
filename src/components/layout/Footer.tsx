import Link from 'next/link'
import Image from 'next/image'

const COLUMNS = [
  {
    label: 'Product',
    links: [
      { href: '/app', text: 'Scanner' },
      { href: '/history', text: 'Scan history' },
      { href: '/#features', text: 'Features' },
      { href: '/#pricing', text: 'Pricing' },
    ],
  },
  {
    label: 'Company',
    links: [
      { href: '/about', text: 'About' },
      { href: '/#how-it-works', text: 'How it works' },
      { href: '/#faq', text: 'FAQ' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { href: '/privacy', text: 'Privacy policy' },
      { href: '/terms', text: 'Terms of service' },
    ],
  },
]

/**
 * The page closes on the wordmark blown out to full width and hollowed to an
 * outline, so it registers as a signature rather than as another link.
 */
export default function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-white/5 bg-black pb-10 pt-20">
      <div className="mx-auto mb-20 grid max-w-7xl grid-cols-2 gap-x-8 gap-y-12 px-[var(--gutter)] md:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-6 flex items-center gap-2.5">
            <Image src="/favicon.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">BarcodeSense</span>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.label} aria-label={col.label}>
            <h2 className="mb-6 text-xs font-bold uppercase tracking-label text-zinc-500">
              {col.label}
            </h2>
            <ul className="m-0 list-none space-y-1">
              {col.links.map((l) => (
                <li key={l.href + l.text}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-11 items-center text-sm text-zinc-400 transition-colors duration-[120ms] hover:text-white"
                  >
                    {l.text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Oversized outlined wordmark. Decorative, so it is hidden from
          assistive technology and never announced twice. */}
      <div aria-hidden="true" className="pointer-events-none flex select-none items-center justify-center py-6">
        <span className="text-stroke w-full whitespace-nowrap text-center font-display text-[11.2vw] font-extrabold leading-none tracking-tightest">
          BARCODESENSE
        </span>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 px-[var(--gutter)] pt-8 text-[10px] uppercase tracking-label text-zinc-600 md:flex-row">
        <p>© {new Date().getFullYear()} BarcodeSense. All rights reserved.</p>
        <p className="text-center md:text-right">
          Product data from Open Food Facts. Not medical advice.
        </p>
      </div>
    </footer>
  )
}
