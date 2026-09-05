'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, usePrefersReducedMotion } from './hooks'

interface DecodeTextProps {
  text: string
  className?: string
  /** ms between resolve steps. Lower = faster decode. */
  speed?: number
  delay?: number
  as?: 'span' | 'h1' | 'h2' | 'div'
}

// Glyphs the scramble draws from: digits and bar-like marks, so the text
// reads as an unresolved barcode rather than as random letters.
const GLYPHS = '0123456789|/\\▮▯:.'

/**
 * Text that decodes into place (the React Bits DecryptedText pattern, retuned
 * for this brand's glyph set and motion tokens).
 *
 * The real string is always in the DOM for assistive tech and for search;
 * only a `aria-hidden` layer scrambles. Under prefers-reduced-motion the
 * scramble never starts.
 */
export default function DecodeText({
  text,
  className = '',
  speed = 34,
  delay = 0,
  as: Tag = 'span',
}: DecodeTextProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 })
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(text)
  const frame = useRef(0)

  useEffect(() => {
    if (!inView || reduced) {
      setDisplay(text)
      return
    }

    let raf = 0
    let timer = 0
    let resolved = 0
    frame.current = 0

    const step = () => {
      const chars = text.split('')
      const out = chars.map((ch, i) => {
        if (ch === ' ' || ch === '\n') return ch
        if (i < resolved) return ch
        return GLYPHS[(frame.current * 7 + i * 13) % GLYPHS.length]
      })
      setDisplay(out.join(''))
      frame.current += 1

      // Resolve a couple of characters per tick so longer strings do not
      // take proportionally longer to settle.
      resolved += Math.max(1, Math.round(text.length / 26))

      if (resolved <= text.length) {
        raf = window.setTimeout(step, speed)
      } else {
        setDisplay(text)
      }
    }

    timer = window.setTimeout(step, delay)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(raf)
    }
  }, [inView, reduced, text, speed, delay])

  return (
    <Tag ref={ref as never} className={className}>
      {/* The stable string: what a screen reader and a crawler receive. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </Tag>
  )
}
