'use client'

import Link from 'next/link'
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
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
  /** Tilt at rest, in degrees. */
  r: number
  /** 0 is right in front; 1 sits far back, smaller and out of focus. */
  z: number
  /** Scale once docked in the tray. */
  ds: number
  /** Left out on phones, item and tray slot both. */
  desktopOnly?: boolean
  render: () => ReactNode
}

// Listed in tray order: produce, then what Nourish reads off the label.
const ITEMS: FloatItem[] = [
  { id: 'apple', w: 96, h: 96, fx: -0.78, fy: -0.52, mfx: -0.72, mfy: -0.8, r: -14, z: 0, ds: 0.6, render: () => <Apple className="h-full w-full drop-shadow-[0_14px_18px_rgb(120_40_30/0.25)]" /> },
  { id: 'strawberry', w: 72, h: 72, fx: 0.3, fy: -0.9, mfx: 0.04, mfy: -0.96, r: 10, z: 0.45, ds: 0.72, render: () => <Strawberry className="h-full w-full drop-shadow-[0_10px_14px_rgb(140_30_40/0.22)]" /> },
  { id: 'avocado', w: 92, h: 92, fx: 0.84, fy: 0.3, mfx: -0.88, mfy: -0.6, r: 12, z: 0.05, ds: 0.6, render: () => <Avocado className="h-full w-full drop-shadow-[0_14px_18px_rgb(40_70_20/0.25)]" /> },
  { id: 'carrot', w: 104, h: 104, fx: -0.62, fy: 0.72, mfx: -0.7, mfy: 0.82, r: 0, z: 0, ds: 0.56, render: () => <Carrot className="h-full w-full drop-shadow-[0_14px_18px_rgb(170_80_20/0.22)]" /> },
  { id: 'lemon', w: 62, h: 62, fx: 0.98, fy: -0.2, mfx: 0.92, mfy: -0.5, r: 0, z: 0.8, ds: 0.84, render: () => <Lemon className="h-full w-full drop-shadow-[0_10px_14px_rgb(170_130_20/0.22)]" /> },
  { id: 'nutri', w: 176, h: 76, fx: 0.7, fy: -0.58, mfx: 0.62, mfy: -0.8, r: 7, z: 0.15, ds: 0.66, render: () => <NutriCard /> },
  { id: 'protein', w: 148, h: 84, fx: 0.6, fy: 0.72, mfx: 0.62, mfy: 0.85, r: -6, z: 0.1, ds: 0.6, render: () => <ProteinCard /> },
  { id: 'sugar', w: 132, h: 44, fx: -0.3, fy: 0.97, r: 4, z: 0.6, ds: 0.78, desktopOnly: true, render: () => <Pill dot="bg-level-low">Low sugar</Pill> },
  { id: 'vegan', w: 112, h: 44, fx: -0.88, fy: 0.36, r: -8, z: 0.55, ds: 0.78, desktopOnly: true, render: () => <Pill icon={<Leaf className="h-3.5 w-3.5 text-accent-ink" aria-hidden="true" />} check>Vegan</Pill> },
  { id: 'barcode', w: 148, h: 70, fx: -0.28, fy: -0.86, r: -5, z: 0.7, ds: 0.6, desktopOnly: true, render: () => <BarcodeCard /> },
  { id: 'olive', w: 68, h: 68, fx: 0.24, fy: 0.84, mfx: -0.22, mfy: 0.95, r: 0, z: 0.2, ds: 0.74, render: () => <OliveAvatar size={68} className="shadow-[0_12px_24px_rgb(var(--shadow)/0.2)]" /> },
]

// Where the tray draws a divider: after the produce, before Olive.
const DIVIDERS = new Set(['lemon', 'barcode'])

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Food and label facts drift around the headline, out of focus by depth.
 * Scrolling gathers them into one tray inside a soft frame, the way a scan
 * gathers everything on the pack into one place. Inspired by Dockset.
 */
export default function Hero() {
  const { user } = useAuth()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
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
    if (!section || !stage || still) return

    // Each item flies to its own slot, measured from the stage's centre.
    const measure = () => {
      const s = stage.getBoundingClientRect()
      const cx = s.left + s.width / 2
      const cy = s.top + s.height / 2
      ITEMS.forEach((_, i) => {
        const slot = slotRefs.current[i]
        const item = itemRefs.current[i]
        if (!slot || !item) return
        const r = slot.getBoundingClientRect()
        item.style.setProperty('--dx', `${r.left + r.width / 2 - cx}px`)
        item.style.setProperty('--dy', `${r.top + r.height / 2 - cy}px`)
      })
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const travel = rect.height - stage.offsetHeight
      const p = travel > 0 ? clamp(-rect.top / travel) : 0

      section.style.setProperty('--h', String(clamp(p / 0.28)))
      section.style.setProperty('--f', String(ease(clamp((p - 0.1) / 0.4))))
      section.style.setProperty('--t', String(clamp((p - 0.5) / 0.22)))
      section.style.setProperty('--c', String(clamp((p - 0.58) / 0.22)))
      section.style.setProperty('--amp', String(1 - clamp(p / 0.35)))
      ITEMS.forEach((_, i) => {
        itemRefs.current[i]?.style.setProperty('--e', String(ease(clamp((p - 0.06 - i * 0.022) / 0.55))))
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
      className={`food-hero relative ${still ? '' : 'h-[230svh]'}`}
      style={{ '--h': 0, '--f': 0, '--t': 0, '--c': 0, '--amp': 1 } as CSSProperties}
    >
      <div
        ref={stageRef}
        className={`food-stage relative overflow-hidden ${still ? 'h-[max(640px,calc(100svh-5rem))]' : 'sticky top-20 h-[calc(100svh-5rem)] min-h-[560px]'}`}
      >
        {/* The frame everything gathers into. */}
        {!still && (
          <div aria-hidden="true" className="food-frame absolute inset-x-[var(--gutter)] bottom-[3%] top-[3%] rounded-[2rem]">
            <div className="absolute inset-x-0 top-[26%] px-6 text-center" style={{ opacity: 'var(--c)', transform: 'translateY(calc((1 - var(--c)) * 16px))' }}>
              <p className="t-eyebrow">One scan</p>
              <p className="mx-auto mt-3 max-w-xl font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.04em] text-ink">
                Everything on the label, <em className="font-serif font-normal not-italic text-accent-ink [font-family:Georgia,'Times_New_Roman',serif]">in one place.</em>
              </p>
            </div>
          </div>
        )}

        {/* The tray: slots the floating items land in. */}
        {!still && (
          <div aria-hidden="true" className="absolute inset-x-[calc(var(--gutter)+1rem)] bottom-[calc(3%+1.25rem)] flex justify-center">
            <div className="relative flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-[1.75rem] px-4 py-3 sm:gap-x-4">
              <div className="food-tray absolute inset-0 rounded-[inherit]" style={{ opacity: 'var(--t)' }} />
              {ITEMS.map((item, i) => (
                <Fragment key={item.id}>
                  <div
                    ref={(el) => {
                      slotRefs.current[i] = el
                    }}
                    className={`relative ${item.desktopOnly ? 'max-sm:hidden' : ''}`}
                    style={{ width: `calc(${item.w * item.ds}px * var(--md))`, height: `calc(${item.h * item.ds}px * var(--md))` }}
                  />
                  {DIVIDERS.has(item.id) && (
                    <span className="relative h-8 w-px bg-line-strong/20 max-sm:hidden" style={{ opacity: 'var(--t)' }} />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}

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
                  '--b': `${item.z * 6}px`,
                  '--o': 1 - item.z * 0.3,
                  '--ds': item.ds,
                  '--e': 0,
                } as CSSProperties
              }
            >
              <div className="food-float h-full w-full" style={{ animationDuration: `${5 + (i % 4) * 0.9}s`, animationDelay: `${-i * 0.7}s` }}>
                {item.render()}
              </div>
            </div>
          ))}
        </div>

        {/* Headline. */}
        <div
          className="food-copy relative z-10 flex h-full flex-col items-center justify-center px-[var(--gutter)] pb-6 text-center"
          style={{ opacity: 'calc(1 - var(--h))', transform: 'translateY(calc(var(--h) * -36px)) scale(calc(1 - var(--h) * 0.04))', filter: 'blur(calc(var(--h) * 6px))' }}
        >
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
          <span aria-hidden="true" className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-xs text-ink-3" style={{ opacity: 'calc(1 - var(--h) * 3)' }}>
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

function Pill({ children, dot, icon, check }: { children: ReactNode; dot?: string; icon?: ReactNode; check?: boolean }) {
  return (
    <div className="food-card flex h-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-ink">
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
      {icon}
      {children}
      {check && <Check className="h-3.5 w-3.5 text-level-low" aria-hidden="true" />}
    </div>
  )
}
