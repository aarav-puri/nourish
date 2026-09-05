'use client'

import { useEffect, useState } from 'react'
import { useInView, usePrefersReducedMotion } from './hooks'

interface CountUpProps {
  to: number
  suffix?: string
  prefix?: string
  decimals?: number
  duration?: number
  className?: string
}

/**
 * A number that counts up when it enters the viewport (the React Bits CountUp
 * pattern on the brand's motion tokens). Rendered in tabular mono so the
 * width never changes as the digits roll.
 *
 * The final value is exposed to assistive tech immediately - a screen reader
 * hears the number, not the animation.
 */
export default function CountUp({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 1400,
  className = '',
}: CountUpProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.5 })
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setValue(to)
      return
    }

    let raf = 0
    const start = performance.now()

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      // Same deceleration curve as the CSS --ease-scan token.
      const eased = 1 - Math.pow(1 - p, 4)
      setValue(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setValue(to)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, to, duration])

  const shown = `${prefix}${value.toFixed(decimals)}${suffix}`
  const final = `${prefix}${to.toFixed(decimals)}${suffix}`

  return (
    <span ref={ref} className={`tnum ${className}`}>
      <span className="sr-only">{final}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  )
}
