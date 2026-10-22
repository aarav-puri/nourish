'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Check, ChevronDown, Leaf } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import OliveAvatar from '@/components/brand/OliveAvatar'
import { Apple, Avocado, Carrot, Lemon, Strawberry } from '@/components/home/FoodArt'

interface FloatItem {
  id: string
  /** Size at rest, in pixels. */
  w: number
  h: number
  /** Resting spot as a share of the stage's half width and height. */
  fx: number
  fy: number
  /** The same on phones, where the copy takes the full width. */
  mfx?: number
  mfy?: number
  /** Tilt while still unread, in degrees. */
  r: number
  /** 0 is right in front; 1 sits far back, smaller and out of focus. */
  z: number
  /** What the scan reads off it. Cards carry their own facts and get a tick. */
  tag?: string
  /** Left out on phones. */
  desktopOnly?: boolean
  render: () => ReactNode
}

const ITEMS: FloatItem[] = [
  { id: 'apple', w: 96, h: 96, fx: -0.78, fy: -0.52, mfx: -0.72, mfy: -0.8, r: -14, z: 0.1, tag: '4g fiber', render: () => <Apple className="h-full w-full drop-shadow-[0_14px_18px_rgb(120_40_30/0.25)]" /> },
  { id: 'strawberry', w: 72, h: 72, fx: 0.3, fy: -0.9, mfx: 0.04, mfy: -0.96, r: 10, z: 0.5, tag: 'Antioxidants', render: () => <Strawberry className="h-full w-full drop-shadow-[0_10px_14px_rgb(140_30_40/0.22)]" /> },
  { id: 'avocado', w: 92, h: 92, fx: 0.84, fy: 0.3, r: 12, z: 0.15, tag: 'Good fats', desktopOnly: true, render: () => <Avocado className="h-full w-full drop-shadow-[0_14px_18px_rgb(40_70_20/0.25)]" /> },
  { id: 'carrot', w: 104, h: 104, fx: -0.62, fy: 0.72, mfx: -0.7, mfy: 0.82, r: 0, z: 0.1, tag: 'Vitamin A', render: () => <Carrot className="h-full w-full drop-shadow-[0_14px_18px_rgb(170_80_20/0.22)]" /> },
  { id: 'lemon', w: 62, h: 62, fx: 0.98, fy: -0.2, r: 0, z: 0.8, tag: 'Vitamin C', desktopOnly: true, render: () => <Lemon className="h-full w-full drop-shadow-[0_10px_14px_rgb(170_130_20/0.22)]" /> },
  { id: 'nutri', w: 176, h: 76, fx: 0.7, fy: -0.58, mfx: 0.62, mfy: -0.8, r: 7, z: 0.25, render: () => <NutriCard /> },
  { id: 'protein', w: 148, h: 84, fx: 0.6, fy: 0.72, mfx: 0.62, mfy: 0.85, r: -6, z: 0.2, render: () => <ProteinCard /> },
  { id: 'sugar', w: 132, h: 44, fx: -0.3, fy: 0.97, r: 4, z: 0.6, desktopOnly: true, render: () => <Pill dot="bg-level-low">Low sugar</Pill> },
  { id: 'vegan', w: 112, h: 44, fx: -0.88, fy: 0.36, r: -8, z: 0.55, desktopOnly: true, render: () => <Pill icon={<Leaf className="h-3.5 w-3.5 text-accent-ink" aria-hidden="true" />}>Vegan</Pill> },
  { id: 'barcode', w: 148, h: 70, fx: -0.28, fy: -0.86, r: -5, z: 0.7, tag: 'Scanned', desktopOnly: true, render: () => <BarcodeCard /> },
  { id: 'olive', w: 68, h: 68, fx: 0.24, fy: 0.84, mfx: -0.22, mfy: 0.95, r: 0, z: 0.3, tag: 'Ask Olive', render: () => <OliveAvatar size={68} className="shadow-[0_12px_24px_rgb(var(--shadow)/0.2)]" /> },
]

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
// How far past an item, in pixels, the scan line travels before it is fully in focus.
const FOCUS_BAND = 140

/**
 * From blur to clarity: food and label facts drift around the headline, out
 * of focus. Scrolling sweeps a scan line down the hero, and everything it
 * passes sharpens, settles and says what it is.
 */
export default function Hero() {
  const { user } = useAuth()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [still, setStill] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setStill(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return
    if (still) {
      itemRefs.current.forEach((item) => item?.style.setProperty('--e', '1'))
      return
    }

    // Each item's height on the stage, so the scan line knows when it passes.
    let centres: number[] = []
    const measure = () => {
      const top = stage.getBoundingClientRect().top
      centres = itemRefs.current.map((item) => {
        if (!item) return 0
        const r = item.getBoundingClientRect()
        return r.top + r.height / 2 - top
      })
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const height = stage.offsetHeight
      const travel = rect.height - height
      const p = travel > 0 ? clamp(-rect.top / travel) : 0
      const sweep = ease(clamp((p - 0.06) / 0.74))
      const line = -0.08 * height + sweep * 1.16 * height

      section.style.setProperty('--scan-y', `${line}px`)
      section.style.setProperty('--scan', String(Math.min(clamp(sweep / 0.06), clamp((1 - sweep) / 0.08))))
      section.style.setProperty('--amp', String(1 - sweep))
      section.style.setProperty('--cue', String(1 - clamp(p / 0.08)))
      itemRefs.current.forEach((item, i) => {
        item?.style.setProperty('--e', String(ease(clamp((line - centres[i]) / FOCUS_BAND))))
      })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    measure()
    update()
    const observer = new ResizeObserver(() => {
      measure()
      schedule()
    })
    observer.observe(stage)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [still])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-h"
      className={`food-hero relative ${still ? '' : 'h-[190svh]'}`}
      style={{ '--scan-y': '0px', '--scan': 0, '--amp': 1, '--cue': 1 } as CSSProperties}
    >
      <div
        ref={stageRef}
        className={`food-stage relative overflow-hidden ${still ? 'h-[max(640px,calc(100svh-5rem))]' : 'sticky top-20 h-[calc(100svh-5rem)] min-h-[560px]'}`}
      >
        {/* The scan line, trailing a soft wash of light. */}
        {!still && <div aria-hidden="true" className="food-scan" />}

        {/* Floating food. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {ITEMS.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className={`food-item ${item.desktopOnly ? 'max-sm:hidden' : ''}`}
              style={
                {
                  width: item.w,
                  height: item.h,
                  '--fx': item.fx,
                  '--fy': item.fy,
                  '--mfx': item.mfx ?? item.fx,
                  '--mfy': item.mfy ?? item.fy,
                  '--r': `${item.r}deg`,
                  '--s': 1 - item.z * 0.35,
                  '--b': `${2 + item.z * 6}px`,
                  '--o': 0.55 - item.z * 0.15,
                  '--e': 0,
                } as CSSProperties
              }
            >
              <div className="food-float relative h-full w-full" style={{ animationDuration: `${5 + (i % 4) * 0.9}s`, animationDelay: `${-i * 0.7}s` }}>
                <div className="food-focus h-full w-full">{item.render()}</div>
                {item.tag ? (
                  <span className="food-tag">
                    <Check className="h-3 w-3 text-level-low" strokeWidth={3} aria-hidden="true" />
                    {item.tag}
                  </span>
                ) : (
                  <span className="food-tick">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Headline. */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-[var(--gutter)] pb-6 text-center">
          <h1 id="hero-h" className="font-display text-[clamp(2.9rem,7.6vw,6.2rem)] font-bold leading-[1.02] tracking-[-0.05em] text-ink">
            Good food.
            <br />
            <em className="font-normal not-italic text-accent-ink [font-family:Georgia,'Times_New_Roman',serif]">Informed choices.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">Scan a barcode. Understand your food.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app" className="btn-primary min-h-12 rounded-full px-6">
              {user ? 'Open scanner' : 'Scan your first product'}
            </Link>
            <Link href="#how" className="btn-secondary min-h-12 rounded-full px-6">
              How it works
            </Link>
          </div>
        </div>

        {!still && (
          <span aria-hidden="true" className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-xs text-ink-3" style={{ opacity: 'var(--cue)' }}>
            Scroll
            <ChevronDown className="food-cue mt-1 h-4 w-4" />
          </span>
        )}
      </div>
    </section>
  )
}

function NutriCard() {
  const grades = [
    ['A', 'bg-grade-a'],
    ['B', 'bg-grade-b'],
    ['C', 'bg-grade-c'],
    ['D', 'bg-grade-d'],
    ['E', 'bg-grade-e'],
  ]
  return (
    <div className="food-card flex h-full flex-col justify-center gap-2 px-3.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Nutri-Score</span>
      <span className="flex items-center gap-1">
        {grades.map(([g, bg], i) => (
          <span
            key={g}
            className={`flex items-center justify-center rounded-md font-display font-bold text-white ${bg} ${i === 0 ? 'h-8 w-8 text-base shadow-[0_4px_10px_rgb(3_129_65/0.35)]' : 'h-6 w-6 text-xs opacity-45'}`}
          >
            {g}
          </span>
        ))}
      </span>
    </div>
  )
}

function ProteinCard() {
  return (
    <div className="food-card flex h-full flex-col justify-center px-3.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Protein</span>
      <span className="mt-0.5 font-display text-2xl font-bold tracking-tight text-ink">
        12.4<span className="ml-0.5 text-sm font-semibold text-ink-2">g</span>
      </span>
      <span className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <span className="block h-full w-[62%] rounded-full bg-accent" />
      </span>
    </div>
  )
}

function BarcodeCard() {
  return (
    <div className="food-card flex h-full flex-col items-center justify-center gap-1 px-3">
      <span className="scan-art-bars !h-9 !w-[104px]" />
      <span className="font-mono text-[10px] tracking-[0.12em] text-ink-2">5 000159 461122</span>
    </div>
  )
}

function Pill({ children, dot, icon }: { children: ReactNode; dot?: string; icon?: ReactNode }) {
  return (
    <div className="food-card flex h-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-ink">
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
      {icon}
      {children}
    </div>
  )
}
