'use client'

import { useEffect, useState } from 'react'

/**
 * A live "working" line for AI requests: a shimmering pixel grid, what is
 * happening, and how long it has taken so far, so a slow answer reads as
 * progress rather than a hang.
 */
export default function Thinking({ label, className = '' }: { label: string; className?: string }) {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span role="status" className={`inline-flex items-center gap-2.5 text-sm ${className}`}>
      <PixelGrid />
      <span className="thinking-shimmer font-medium">{label}</span>
      <span className="tnum font-mono text-xs text-ink-3">{((now - start) / 1000).toFixed(1)}s</span>
    </span>
  )
}

/** Nine cells lighting in a diagonal wave. */
export function PixelGrid({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 grid-cols-3 gap-[2px] ${className}`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="pixel-cell h-[4px] w-[4px] rounded-[1px] bg-current"
          style={{ animationDelay: `${((i % 3) + Math.floor(i / 3)) * 110}ms` }}
        />
      ))}
    </span>
  )
}
