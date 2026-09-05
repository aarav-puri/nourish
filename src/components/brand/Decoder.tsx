'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { seeded, useCoarsePointer, useIsVisible, useMinWidth, usePrefersReducedMotion } from './hooks'

/**
 * THE DECODER, the site's centrepiece.
 *
 * A barcode is information a shopper cannot read. This product reads it.
 * So the hero is a barcode you sweep a scan head across: everything the head
 * has crossed stops being noise and becomes data. Raw bars are gray and
 * jagged; decoded bars turn signal-green and settle into a smooth readout
 * curve, and the findings anchored to those positions surface as you reach
 * them. Sweeping it performs the product's actual job.
 *
 * Build notes
 * - Canvas 2D for the bars, real DOM for the findings, so the text stays
 *   crisp, selectable and readable by assistive technology.
 * - Geometry comes from a seeded PRNG, never Math.random, so the layout is
 *   stable across renders and identical on every device.
 * - One rAF loop, transforms only, no shadowBlur. It parks itself the moment
 *   the canvas leaves the viewport.
 * - Coarse pointer and idle desktop both fall back to an auto-sweep;
 *   prefers-reduced-motion renders the fully decoded end state and never
 *   starts the loop at all.
 */

// Monochrome: raw encoding sits in the dark gray, the beam is pure white,
// and everything already read falls back to a mid gray. Value alone carries
// the read/unread distinction.
const INK_RAW = '#3A3A3A'
const SIGNAL = '#FFFFFF'
const SIGNAL_PASSED = '#8F8F8F'

/** Findings anchored to positions along the strip, in sweep order. */
export const FINDINGS = [
  { at: 0.16, k: 'INGREDIENTS', v: '31 listed', tone: 'neutral' as const },
  { at: 0.38, k: 'ADDED SUGAR', v: '34g / 100g', tone: 'alarm' as const },
  { at: 0.60, k: 'ADDITIVES', v: 'E621 · E471', tone: 'alarm' as const },
  { at: 0.82, k: 'BETTER SWAP', v: 'found, 1 nearby', tone: 'good' as const },
]

interface Bar {
  x: number
  w: number
  raw: number
  decoded: number
}

function FindingChip({ tone, k, v }: { tone: (typeof FINDINGS)[number]['tone']; k: string; v: string }) {
  return (
    <div
      className={`whitespace-nowrap rounded-xl border px-3 py-2 font-mono text-[10px] uppercase leading-tight tracking-label ${
        tone === 'alarm'
          ? 'border-white bg-white font-bold text-black'
          : tone === 'good'
            ? 'border-white/40 bg-black/80 text-white backdrop-blur-md'
            : 'border-white/12 bg-black/80 text-zinc-400 backdrop-blur-md'
      }`}
    >
      <span className="block opacity-70">{k}</span>
      <span className="block font-medium">{v}</span>
    </div>
  )
}

export default function Decoder({ className = '' }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barsRef = useRef<Bar[]>([])
  const sizeRef = useRef({ w: 0, h: 0 })

  // Animation state lives in refs: a pointer move must never cause a render.
  const headRef = useRef(0.001)
  const targetRef = useRef(0.5)
  const autoRef = useRef(true)
  const dirRef = useRef(1)
  const idleAtRef = useRef(0)

  const reduced = usePrefersReducedMotion()
  const coarse = useCoarsePointer()
  const visible = useIsVisible(wrapRef)
  // Four findings cannot sit side by side on a narrow strip without
  // colliding, so below this width they reflow into a list underneath.
  const anchored = useMinWidth(720)

  // Mirrored to state only for the DOM findings, and only when a threshold
  // is actually crossed - not every frame.
  const [progress, setProgress] = useState(reduced ? 1 : 0)

  /** Rebuild bar geometry for the current pixel size. */
  const layout = useCallback((w: number, h: number) => {
    const unit = w < 560 ? 7 : 9
    const count = Math.max(24, Math.floor(w / unit))
    const rand = seeded(20240517)
    const bars: Bar[] = []
    let x = 0

    for (let i = 0; i < count; i++) {
      const bw = 1 + Math.round(rand() * 3)
      const gap = 2 + Math.round(rand() * 3)
      if (x + bw > w) break

      // Raw: noisy and tall - unreadable encoding.
      const raw = 0.55 + rand() * 0.45
      // Decoded: a smooth composite curve - the same strip, now a readout.
      const p = i / count
      const decoded =
        0.28 +
        0.3 * Math.sin(p * Math.PI * 2.1) ** 2 +
        0.22 * Math.sin(p * Math.PI * 5.6 + 1.1) ** 2 +
        0.1 * rand()

      bars.push({ x, w: bw, raw, decoded: Math.min(1, decoded) })
      x += bw + gap
    }

    barsRef.current = bars
    sizeRef.current = { w, h }
  }, [])

  /** Paint one frame at the given head position. */
  const paint = useCallback((head: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const { w, h } = sizeRef.current
    if (!w || !h) return

    ctx.clearRect(0, 0, w, h)

    const baseline = h - 26
    const span = baseline - 8
    const headPx = head * w
    // Bars within this distance of the head are mid-decode.
    const edge = Math.max(34, w * 0.055)

    for (const b of barsRef.current) {
      const d = headPx - (b.x + b.w / 2)
      // 0 = untouched, 1 = fully decoded.
      const t = d <= -edge ? 0 : d >= 0 ? 1 : 1 + d / edge
      const eased = t * t * (3 - 2 * t)

      const height = (b.raw + (b.decoded - b.raw) * eased) * span
      const y = baseline - height

      if (eased <= 0.001) {
        ctx.fillStyle = INK_RAW
      } else if (d < edge * 0.9) {
        ctx.fillStyle = SIGNAL // in the beam: full brightness
      } else {
        ctx.fillStyle = SIGNAL_PASSED // decoded and behind the head
      }

      ctx.fillRect(b.x, y, b.w, height)
    }

    // Baseline rule + measuring ticks.
    ctx.fillStyle = '#4A4A4A'
    ctx.fillRect(0, baseline + 6, w, 1)
    for (let x = 0; x < w; x += 8) ctx.fillRect(x, baseline + 6, 1, x % 40 === 0 ? 7 : 3)

    // The beam: a soft leading gradient plus a hard core.
    const glow = ctx.createLinearGradient(headPx - edge, 0, headPx + 3, 0)
    glow.addColorStop(0, 'rgba(255,255,255,0)')
    glow.addColorStop(1, 'rgba(255,255,255,0.16)')
    ctx.fillStyle = glow
    ctx.fillRect(headPx - edge, 0, edge, baseline + 6)

    ctx.fillStyle = SIGNAL
    ctx.fillRect(headPx - 1, 0, 2, baseline + 14)
    ctx.fillRect(headPx - 5, 0, 10, 2)
    ctx.fillRect(headPx - 5, baseline + 12, 10, 2)
  }, [])

  /* ---- sizing ---- */
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = wrap.getBoundingClientRect()
      const w = Math.max(1, Math.round(rect.width))
      const h = Math.max(1, Math.round(rect.height))

      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)

      layout(w, h)
      paint(reduced ? 1 : headRef.current)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [layout, paint, reduced])

  /* ---- animation ---- */
  useEffect(() => {
    // Reduced motion: draw the finished, fully decoded strip. No loop.
    if (reduced) {
      headRef.current = 1
      setProgress(1)
      paint(1)
      return
    }
    if (!visible) return

    let raf = 0
    let last = 0

    const loop = (now: number) => {
      if (autoRef.current) {
        // Auto-sweep: touch devices, and desktop after the pointer goes idle.
        const t = now / 1000
        const cycle = (Math.sin(t * 0.42) + 1) / 2
        targetRef.current = 0.06 + cycle * 0.88
        dirRef.current = Math.cos(t * 0.42) >= 0 ? 1 : -1
      }

      // Critically damped follow - the head has weight, it does not snap.
      headRef.current += (targetRef.current - headRef.current) * 0.09
      paint(headRef.current)

      // Findings are DOM, so only re-render when the value actually moves.
      if (now - last > 90) {
        last = now
        setProgress((p) => (Math.abs(p - headRef.current) > 0.01 ? headRef.current : p))
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [paint, reduced, visible])

  /* ---- pointer ---- */
  useEffect(() => {
    // Touch pointers keep the auto-sweep: dragging a finger across the hero
    // would fight the page scroll.
    if (coarse || reduced) {
      autoRef.current = true
      return
    }

    const wrap = wrapRef.current
    if (!wrap) return

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      targetRef.current = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
      autoRef.current = false
      idleAtRef.current = performance.now()
    }

    const onLeave = () => {
      autoRef.current = true
    }

    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)

    // Hand control back to the sweep once the pointer has rested.
    const idle = window.setInterval(() => {
      if (!autoRef.current && performance.now() - idleAtRef.current > 2600) {
        autoRef.current = true
      }
    }, 700)

    return () => {
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
      window.clearInterval(idle)
    }
  }, [coarse, reduced])

  /* ---- keyboard ---- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (reduced) return
    const step = e.shiftKey ? 0.2 : 0.06
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      autoRef.current = false
      idleAtRef.current = performance.now()
      targetRef.current = Math.min(
        1,
        Math.max(0, targetRef.current + (e.key === 'ArrowRight' ? step : -step))
      )
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={wrapRef}
        tabIndex={0}
        role="group"
        aria-label="Interactive barcode decoder. Move your pointer across it, or use the left and right arrow keys, to scan it. What it finds is listed below."
        onKeyDown={onKeyDown}
        className="relative h-[240px] w-full cursor-crosshair touch-pan-y sm:h-[300px] lg:h-[360px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />

        {/* Findings: real DOM text, always present for assistive tech. The
            sweep only changes how they are presented. */}
        {anchored && (
          <ul className="pointer-events-none absolute inset-0 m-0 list-none">
            {FINDINGS.map((f) => {
              const on = progress >= f.at
              // Clamp the outermost anchors so a pill never runs off the edge.
              const align =
                f.at < 0.25 ? 'translate-x-0' : f.at > 0.75 ? '-translate-x-full' : '-translate-x-1/2'
              return (
                <li
                  key={f.k}
                  className={`absolute top-0 ${align} transition-[opacity,transform] duration-[260ms] ease-scan motion-reduce:transition-none`}
                  style={{ left: `${f.at * 100}%`, opacity: on ? 1 : 0 }}
                >
                  <FindingChip tone={f.tone} k={f.k} v={f.v} />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {!anchored && (
        <ul className="mt-5 flex list-none flex-wrap gap-2">
          {FINDINGS.map((f) => (
            <li
              key={f.k}
              className="transition-opacity duration-[260ms] motion-reduce:transition-none"
              style={{ opacity: progress >= f.at ? 1 : 0.28 }}
            >
              <FindingChip tone={f.tone} k={f.k} v={f.v} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-label text-zinc-500">
        <span>EAN 8 712100 843792</span>
        <span aria-hidden="true" className="hidden sm:inline">
          {coarse ? 'SWEEPING' : 'MOVE TO SCAN'}
        </span>
      </p>
    </div>
  )
}
