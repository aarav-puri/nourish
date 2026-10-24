'use client'

import Link from 'next/link'
import type { Food } from '@/lib/food'
import { timeAgo } from '@/lib/time'
import { ScoreBadge } from '@/components/product/Grade'
import ProductThumb from '@/components/product/ProductThumb'

export interface RecentScan {
  id: string
  food: Food
  scannedAt: string
}

// Well-documented barcodes, for anyone without a product to hand.
const EXAMPLES = [
  { code: '3017620422003', name: 'Nutella' },
  { code: '5449000000996', name: 'Coca-Cola' },
  { code: '737628064502', name: 'Rice noodles' },
]

export default function RecentScans({ items, onOpen }: { items: RecentScan[] | null; onOpen: (code: string) => void }) {
  return (
    <section aria-labelledby="recent-h" className="card self-start p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-h" className="font-display text-lg font-bold tracking-tight">
          Recent scans
        </h2>
        {items && items.length > 0 && (
          <Link href="/history" className="text-sm font-medium text-ink-2 hover:text-ink">
            See all
          </Link>
        )}
      </div>

      {items === null ? (
        <ul className="mt-3 space-y-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <div className="skeleton h-11 w-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-2/3" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line bg-paper/70 p-5">
          <p className="font-medium">Nothing scanned yet</p>
          <p className="mt-1 text-sm text-ink-2">No product to hand? Try one of these.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e.code}
                type="button"
                onClick={() => onOpen(e.code)}
                className="chip h-9 px-3 transition-colors hover:border-ink/30 hover:text-ink"
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {items.map(({ id, food, scannedAt }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onOpen(food.barcode)}
                className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-ink/[0.03]"
              >
                <ProductThumb food={food} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">
                    {food.name}
                  </span>
                  <span className="block truncate text-xs text-ink-3">
                    {[food.brand, timeAgo(scannedAt)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <ScoreBadge grade={food.grade} score={food.score} size="sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
