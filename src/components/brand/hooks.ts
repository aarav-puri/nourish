'use client'

import { useEffect, useRef, useState, RefObject } from 'react'

/**
 * Live reduced-motion preference. Every animated component in the brand
 * library reads this and degrades to a static end-state rather than
 * simply running faster.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

/** True once the element has entered the viewport. Fires once, then disconnects. */
export function useInView<T extends HTMLElement>(
  options: { rootMargin?: string; threshold?: number } = {}
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const { rootMargin = '0px 0px -12% 0px', threshold = 0.15 } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No IntersectionObserver (or a test env): show the content rather than hide it.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin, threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, threshold])

  return [ref, inView]
}

/**
 * Whether the element is currently on screen, kept up to date both ways.
 * Used to park animation frames for off-screen canvases.
 */
export function useIsVisible<T extends HTMLElement>(ref: RefObject<T | null>): boolean {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])

  return visible
}

/** True when the viewport is at least `px` wide. False during SSR. */
export function useMinWidth(px: number): boolean {
  const [wide, setWide] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`)
    const sync = () => setWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [px])

  return wide
}

/** Coarse pointer (touch) - drives the interaction fallbacks. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const sync = () => setCoarse(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return coarse
}

/**
 * Deterministic pseudo-random from a seed. Bar layouts must be identical on
 * the server and the client, so Math.random is never used for geometry.
 */
export function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
