'use client'

import { ReactNode, useCallback, useRef } from 'react'
import { Bot, Repeat, Leaf, ScanLine, CheckSquare, ChefHat, MessagesSquare } from 'lucide-react'
import FeatureVisual, { VisualKey } from './FeatureVisual'
import Reveal from '@/components/brand/Reveal'
import { useCoarsePointer, usePrefersReducedMotion } from '@/components/brand/hooks'

/**
 * Capabilities as a bento, so no two cards carry the same weight and the eye
 * has somewhere to land. Each card holds its own bespoke diagram rather than
 * a shared icon treatment, so the section reads as seven different readings
 * of one strip.
 */

interface Cell {
  k: VisualKey
  icon: typeof Bot
  title: string
  body: string
  span: string
  size?: 'lg' | 'md' | 'sm'
}

const CELLS: Cell[] = [
  {
    k: 'ai',
    icon: Bot,
    title: 'An answer, not a label',
    body: 'Forget squinting at the back of the package. We read the ingredients, additives and nutrition together and tell you how healthy it is, out of 100.',
    span: 'lg:col-span-2 lg:row-span-2',
    size: 'lg',
  },
  {
    k: 'swap',
    icon: Repeat,
    title: 'A better option, nearby',
    body: 'Stop settling for the first thing you picked up. We find a similar product that scores better and show you the difference in sugar, additives and price.',
    span: 'lg:col-span-2',
    size: 'md',
  },
  {
    k: 'diet',
    icon: CheckSquare,
    title: 'Checks your diet for you',
    body: 'Vegan, gluten free, keto, nut free and more. We check every one against the full ingredient list so you do not have to.',
    span: '',
    size: 'sm',
  },
  {
    k: 'eco',
    icon: Leaf,
    title: 'The footprint, in context',
    body: 'See how the carbon footprint compares with others in the same category, so the number actually means something.',
    span: '',
    size: 'sm',
  },
  {
    k: 'scan',
    icon: ScanLine,
    title: 'Scan it however you like',
    body: 'Camera, photo, drag and drop, clipboard, or just type the number. Whatever is quickest where you are standing.',
    span: '',
    size: 'sm',
  },
  {
    k: 'recipe',
    icon: ChefHat,
    title: 'Something to cook',
    body: "Ideas for dinner built from the things you have already scanned.",
    span: '',
    size: 'sm',
  },
  {
    k: 'assistant',
    icon: MessagesSquare,
    title: 'Ask it anything',
    body: "Ask about anything you have scanned. It remembers your whole history, so the answer is about your food, not food in general.",
    span: 'lg:col-span-2',
    size: 'md',
  },
]

function Card({ cell, children }: { cell: Cell; children?: ReactNode }) {
  const Icon = cell.icon
  return (
    <div
      data-lit
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/50 to-black p-7 transition-colors duration-[260ms] ease-scan hover:border-white/25 ${cell.span}`}
    >
      {/* The light itself, masked to this card. Its position comes from CSS
          variables the grid sets on pointermove, so moving the cursor never
          triggers a React render. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[420ms] group-hover/grid:opacity-100"
        style={{
          background:
            'radial-gradient(340px circle at var(--mx) var(--my), rgba(255,255,255,0.09), transparent 70%)',
        }}
      />

      {/* The same light again, drawn only on the border. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-[420ms] group-hover/grid:opacity-100"
        style={{
          background:
            'radial-gradient(340px circle at var(--mx) var(--my), rgba(255,255,255,0.55), transparent 68%)',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <span className="mb-5 inline-flex w-fit rounded-xl border border-white/10 bg-white/5 p-3">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <h3
          className={`font-display font-semibold tracking-tight ${
            cell.size === 'lg' ? 'text-3xl' : cell.size === 'md' ? 'text-2xl' : 'text-xl'
          }`}
        >
          {cell.title}
        </h3>

        <p
          className={`mt-3 leading-relaxed text-zinc-400 ${
            cell.size === 'lg' ? 'text-lg' : cell.size === 'sm' ? 'text-sm' : 'text-base'
          }`}
        >
          {cell.body}
        </p>

        {children}
      </div>
    </div>
  )
}

export default function FeatureBento() {
  const gridRef = useRef<HTMLDivElement>(null)
  const coarse = useCoarsePointer()
  const reduced = usePrefersReducedMotion()
  const lit = !coarse && !reduced

  // Each card needs the pointer in its own coordinate space, so the position
  // is written per card rather than once on the grid.
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!lit) return
      const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-lit]')
      cards?.forEach((card) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    },
    [lit]
  )

  return (
    <div
      ref={gridRef}
      onPointerMove={onMove}
      className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${lit ? 'group/grid' : ''}`}
    >
      {CELLS.map((cell, i) => (
        <Reveal key={cell.k} delay={i * 60} className={cell.span}>
          <Card cell={{ ...cell, span: 'h-full' }}>
            <div className="mt-7 border-t border-white/10 pt-6">
              <FeatureVisual k={cell.k} />
            </div>
          </Card>
        </Reveal>
      ))}
    </div>
  )
}
