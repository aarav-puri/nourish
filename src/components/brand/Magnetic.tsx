'use client'

import { ReactNode, useRef } from 'react'
import { useCoarsePointer, usePrefersReducedMotion } from './hooks'

interface MagneticProps {
  children: ReactNode
  /** Peak pull in px at the edge of the element. */
  strength?: number
  className?: string
}

/**
 * Pulls its child a few pixels toward the cursor (the React Bits Magnet
 * pattern, damped down so it reads as weight rather than as a toy).
 *
 * Writes the transform straight to the node rather than through state, so a
 * pointermove never triggers a React render. Disabled entirely for touch
 * pointers and under prefers-reduced-motion.
 */
export default function Magnetic({ children, strength = 10, className = '' }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const coarse = useCoarsePointer()
  const reduced = usePrefersReducedMotion()
  const active = !coarse && !reduced

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || !active) return
    const r = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`
  }

  const reset = () => {
    const el = ref.current
    if (el) el.style.transform = 'translate3d(0,0,0)'
  }

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onBlur={reset}
      className={`inline-block will-change-transform transition-transform duration-[260ms] ease-scan ${className}`}
    >
      {children}
    </span>
  )
}
