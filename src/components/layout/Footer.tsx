import Link from 'next/link'
import Wordmark from '@/components/brand/Wordmark'

const COLUMNS = [
  {
    label: 'Product',
    links: [
      { href: '/app', text: 'Scanner' },
      { href: '/history', text: 'History' },
      { href: '/settings', text: 'Settings' },
    ],
  },
  {
    label: 'Nourish',
    links: [
      { href: '/about', text: 'About' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { href: '/privacy', text: 'Privacy' },
      { href: '/terms', text: 'Terms' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 px-[var(--gutter)] py-14 md:grid-cols-[2fr_repeat(3,1fr)]">
        <div className="col-span-2 md:col-span-1">
          <Wordmark byline />
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.label} aria-label={col.label}>
            <h2 className="t-eyebrow">{col.label}</h2>
            <ul className="mt-3 space-y-0.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-9 items-center text-sm text-ink-2 transition-colors hover:text-ink">
                    {l.text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-line px-[var(--gutter)] py-6 text-xs text-ink-3 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Nourish Labs. All rights reserved.</p>
        <p>Product data from Open Food Facts and Go-UPC. Not medical advice.</p>
      </div>
    </footer>
  )
}
