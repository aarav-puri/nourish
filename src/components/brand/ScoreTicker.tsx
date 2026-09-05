'use client'

import { usePrefersReducedMotion } from './hooks'

/**
 * A continuous band of readings crossing the page, the way a market ticker
 * carries prices. It gives the site one piece of ambient motion that says
 * what the product does, without asking the reader to do anything.
 *
 * The entries are illustrative category examples, never named brands, so the
 * page makes no scoring claim about any real manufacturer's product. The band
 * is decorative and hidden from assistive technology.
 *
 * Two identical tracks sit side by side and the pair translates by half its
 * width, so the loop has no seam. It runs on one transform, pauses on hover,
 * and does not run at all under a reduced motion preference.
 */

const READINGS: { item: string; score: number }[] = [
  { item: 'Chocolate spread', score: 20 },
  { item: 'Oat crackers', score: 81 },
  { item: 'Cola', score: 18 },
  { item: 'Greek yogurt', score: 74 },
  { item: 'Instant noodles', score: 27 },
  { item: 'Tinned tomatoes', score: 88 },
  { item: 'Breakfast cereal', score: 41 },
  { item: 'Peanut butter', score: 69 },
  { item: 'Energy drink', score: 15 },
  { item: 'Wholemeal bread', score: 77 },
]

function Track() {
  return (
    <ul className="flex shrink-0 list-none items-center">
      {READINGS.map((r) => (
        <li key={r.item} className="flex items-center gap-4 whitespace-nowrap px-7">
          <span className="text-sm text-zinc-400">{r.item}</span>
          <span
            className={`tnum rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tracking-label ${
              r.score >= 70
                ? 'bg-white text-black'
                : r.score >= 40
                  ? 'border border-white/25 text-zinc-200'
                  : 'border border-white/25 text-zinc-500'
            }`}
          >
            {r.score}
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-white/15" />
        </li>
      ))}
    </ul>
  )
}

export default function ScoreTicker() {
  const reduced = usePrefersReducedMotion()

  return (
    <div
      aria-hidden="true"
      className="group relative overflow-hidden border-y border-white/10 bg-white/[0.015] py-4"
    >
      {/* The band fades into the page at both ends rather than being cut off. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-black to-transparent" />

      <div
        className={`flex w-max ${reduced ? '' : 'animate-ticker group-hover:[animation-play-state:paused]'}`}
      >
        <Track />
        <Track />
      </div>
    </div>
  )
}
