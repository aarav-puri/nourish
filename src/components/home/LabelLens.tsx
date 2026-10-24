'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/*
 * The back of a snack bar, in fine print, with a lens that reads it.
 *
 * Adapted from Lens Card by Motiq (rmahammad on 21st.dev, MIT): a magnified,
 * clipped clone of the content rides a spring-damped lens. Following Torch
 * Reveal from the same library, the clone is not a plain copy: inside the
 * glass the label is "read", with each flagged term highlighted, and a note
 * under the lens says what the term means. Unattended, the lens walks from
 * term to term; a mouse can take it over. Reduced motion parks it on one term.
 */

type Tone = 'high' | 'moderate'

interface Term {
  /** What the lens reads off the label. */
  read: string
  /** What it means, in plain words. */
  meaning: string
  tone: Tone
}

/** Indexed by the number given to each t() in the print below, in reading order. */
const TERMS: Term[] = [
  { read: 'Glucose syrup', meaning: 'Added sugar, under another name.', tone: 'moderate' },
  { read: 'E120', meaning: 'Red dye made from insects. Not vegetarian.', tone: 'high' },
  { read: 'E471', meaning: 'Emulsifier. Can be made from animal fat.', tone: 'moderate' },
  { read: 'May contain peanuts', meaning: 'Allergen. Traces are possible.', tone: 'moderate' },
  { read: 'Saturated fat 7.1 g', meaning: 'High in saturated fat.', tone: 'high' },
  { read: 'Sugars 29 g', meaning: 'High. Nearly a third of it is sugar.', tone: 'high' },
]

/** The term the lens rests on when motion is reduced. */
const PARKED = 1
/** How long the lens rests on each term, in seconds. */
const DWELL = 2.6
const MAG = 1.55

interface Spring {
  x: number
  v: number
}

/** Semi-implicit Euler with substeps, stable at low or uneven frame rates. */
function step(s: Spring, target: number, k: number, c: number, dt: number) {
  const n = dt > 0.012 ? Math.ceil(dt / 0.008) : 1
  const h = dt / n
  for (let i = 0; i < n; i++) {
    s.v += (-k * (s.x - target) - c * s.v) * h
    s.x += s.v * h
  }
  return s.x
}

export default function LabelLens() {
  const rootRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const magRef = useRef<HTMLDivElement>(null)
  const magInnerRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ x: number; y: number; inside: boolean }>({ x: 0, y: 0, inside: false })

  const [active, setActive] = useState(-1)
  // The note keeps its last words while it fades out, so the card never collapses.
  const [note, setNote] = useState(0)
  const [reduced, setReduced] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // Only animate while on screen and the tab is in front.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let onScreen = true
    let tab = document.visibilityState !== 'hidden'
    const sync = () => setVisible(onScreen && tab)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      sync()
    })
    io.observe(root)
    const onVis = () => {
      tab = document.visibilityState !== 'hidden'
      sync()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const base = baseRef.current
    if (!root || !base) return

    let w = 1
    let h = 1
    let radius = 64
    let centres: { x: number; y: number }[] = []
    const measure = () => {
      w = root.clientWidth || 1
      h = root.clientHeight || 1
      radius = w < 420 ? 54 : 70
      const box = root.getBoundingClientRect()
      centres = TERMS.map((_, i) => {
        const el = base.querySelector<HTMLElement>(`[data-term="${i}"]`)
        if (!el) return { x: w / 2, y: h / 2 }
        const r = el.getBoundingClientRect()
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }
      })
    }

    let shown = -2
    const show = (i: number) => {
      if (i !== shown) {
        shown = i
        setActive(i)
        if (i >= 0) setNote(i)
      }
    }

    const place = (x: number, y: number, r: number) => {
      if (magRef.current) magRef.current.style.clipPath = `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`
      if (magInnerRef.current) {
        magInnerRef.current.style.transform = `translate3d(${((1 - MAG) * x).toFixed(2)}px,${((1 - MAG) * y).toFixed(2)}px,0) scale(${MAG})`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${(x - r).toFixed(1)}px,${(y - r).toFixed(1)}px,0)`
        ringRef.current.style.width = ringRef.current.style.height = `${(r * 2).toFixed(1)}px`
      }
      const note = noteRef.current
      if (note) {
        const nw = note.offsetWidth
        const nh = note.offsetHeight
        const gap = 12
        const below = y + r + gap + nh <= h - 8
        const ny = below ? y + r + gap : y - r - gap - nh
        const nx = Math.min(Math.max(x - nw / 2, 8), w - nw - 8)
        note.style.transform = `translate3d(${nx.toFixed(1)}px,${ny.toFixed(1)}px,0)`
      }
    }

    measure()
    const ro = new ResizeObserver(() => {
      measure()
      if (reduced) still()
    })
    ro.observe(root)

    function still() {
      const c = centres[PARKED]
      place(c.x, c.y, radius)
      show(PARKED)
    }

    if (reduced) {
      still()
      return () => ro.disconnect()
    }
    if (!visible) return () => ro.disconnect()

    // Start from the first term so the lens opens on something worth reading.
    const start = centres[0]
    const lx: Spring = { x: start.x, v: 0 }
    const ly: Spring = { x: start.y, v: 0 }
    const grow: Spring = { x: 0, v: 0 }
    let index = 0
    let rested = 0
    let delay = 0.5
    let last = performance.now()
    let raf = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      let dt = (now - last) / 1000
      last = now
      if (!(dt > 0) || dt > 0.05) dt = 0.016
      if (delay > 0) {
        delay -= dt
        return
      }

      const p = pointer.current
      let tx: number
      let ty: number
      if (p.inside) {
        tx = p.x
        ty = p.y
      } else {
        tx = centres[index].x
        ty = centres[index].y
      }
      const k = p.inside ? 300 : 70
      const c = p.inside ? 28 : 14
      step(lx, tx, k, c, dt)
      step(ly, ty, k, c, dt)
      step(grow, 1, 170, 16, dt)
      const r = Math.max(0.5, radius * Math.min(grow.x, 1.15))
      place(lx.x, ly.x, r)

      if (p.inside) {
        // Read whatever term sits under the glass.
        let best = -1
        let bestD = r * 0.7
        centres.forEach((ct, i) => {
          const d = Math.hypot(ct.x - lx.x, ct.y - ly.x)
          if (d < bestD) {
            bestD = d
            best = i
          }
        })
        show(best)
        rested = 0
        return
      }

      const arrived = Math.hypot(tx - lx.x, ty - ly.x) < 4 && Math.abs(lx.v) + Math.abs(ly.v) < 30
      if (arrived) {
        show(index)
        rested += dt
        if (rested > DWELL) {
          rested = 0
          index = (index + 1) % TERMS.length
        }
      } else if (rested === 0) {
        show(-1)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [reduced, visible])

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true }
  }
  const release = () => {
    pointer.current = { ...pointer.current, inside: false }
  }

  const term = TERMS[note]

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="The ingredients and nutrition label of a snack bar. A lens moves over the fine print and explains each flagged term in plain words."
      className="relative isolate w-full select-none"
      onPointerMove={track}
      onPointerLeave={release}
    >
      {/* Unread: the fine print as it comes on the pack. */}
      <div ref={baseRef} aria-hidden="true" className="label-card label-card-base">
        <Print active={-1} read={false} />
      </div>

      {/* Read: the same print under the glass, magnified, with flags. */}
      <div
        ref={magRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{ clipPath: 'circle(0px at -200px -200px)' }}
      >
        <div ref={magInnerRef} className="label-card absolute inset-0 will-change-transform" style={{ transformOrigin: '0 0' }}>
          <Print active={active} read />
        </div>
      </div>

      <div
        ref={ringRef}
        aria-hidden="true"
        className="label-lens-ring pointer-events-none absolute left-0 top-0 z-[3] rounded-full will-change-transform"
        style={{ transform: 'translate3d(-999px,-999px,0)' }}
      />

      <div
        ref={noteRef}
        aria-hidden="true"
        className="label-lens-note pointer-events-none absolute left-0 top-0 z-[4] w-[13.5rem] sm:w-[15rem]"
        data-shown={active >= 0 ? 'true' : 'false'}
        style={{ transform: 'translate3d(-999px,-999px,0)' }}
      >
        <span className="flex items-center gap-2 text-xs font-medium text-on-ink/70">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${term.tone === 'high' ? 'bg-level-high' : 'bg-level-moderate'}`} />
              {term.read}
            </span>
        <span className="mt-1 block text-[0.9375rem] font-semibold leading-snug">{term.meaning}</span>
      </div>
    </div>
  )
}

/** The label's print. Rendered twice, so both copies lay out identically. */
function Print({ active, read }: { active: number; read: boolean }) {
  const t = (i: number, children: ReactNode) => (
    <span
      data-term={read ? undefined : i}
      className={read ? `label-term label-term-${TERMS[i].tone}${active === i ? ' is-active' : ''}` : undefined}
    >
      {children}
    </span>
  )

  return (
    <div className="label-print" data-read={read ? 'true' : 'false'}>
      <p>
        <b>Ingredients:</b> Oat flakes (34%), {t(0, 'glucose syrup')}, sugar, palm fat, strawberry pieces (6%) (sugar,
        strawberry puree, gelling agent: pectin, color: {t(1, 'E120')}), whole <b>milk</b> powder, humectant (E422),
        dextrose, emulsifier ({t(2, 'E471')}), <b>soy</b> lecithin, salt, flavoring, antioxidant (E306).{' '}
        {t(
          3,
          <>
            May contain <b>peanuts</b>
          </>,
        )}{' '}
        and other nuts.
      </p>

      <div className="label-lower">
      <table className="label-table">
        <thead>
          <tr>
            <th scope="col">Nutrition</th>
            <th scope="col">per 100 g</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Energy</td>
            <td>431 kcal</td>
          </tr>
          <tr>
            <td>Fat</td>
            <td>15 g</td>
          </tr>
          <tr>
            <td className="pl-3">Saturated fat</td>
            <td>{t(4, '7.1 g')}</td>
          </tr>
          <tr>
            <td>Carbohydrate</td>
            <td>66 g</td>
          </tr>
          <tr>
            <td className="pl-3">Total sugars</td>
            <td>{t(5, '29 g')}</td>
          </tr>
          <tr>
            <td>Fiber</td>
            <td>4.8 g</td>
          </tr>
          <tr>
            <td>Protein</td>
            <td>6.2 g</td>
          </tr>
          <tr>
            <td>Salt</td>
            <td>0.52 g</td>
          </tr>
        </tbody>
      </table>

      <div className="label-foot">
        <span className="scan-art-bars label-bars" />
        <span className="tnum">5 060412 790318</span>
        <span>Best by: see side of package. Store in a cool, dry place.</span>
      </div>
      </div>
    </div>
  )
}
