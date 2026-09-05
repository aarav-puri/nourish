'use client'

import { ReactNode } from 'react'
import { useInView, usePrefersReducedMotion } from './hooks'

type Variant = 'rise' | 'wipe'

interface RevealProps {
  children: ReactNode
  /**
   * rise - content lifts in. The default, used for most blocks.
   * wipe - a clip path reveal, for headlines and images.
   */
  variant?: Variant
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'span'
}

/**
 * Scroll triggered entrance (the React Bits AnimatedContent and ScrollReveal
 * pattern, rebuilt on this brand's motion tokens).
 *
 * Transforms and opacity only, so the compositor does the work and nothing
 * reflows. Under a reduced motion preference the end state renders
 * immediately: content is never gated behind an animation that will not play.
 *
 * The clip path belongs to the wipe variant alone. Applying it everywhere
 * clips any child that deliberately overflows the box, such as a badge
 * straddling the top edge of a card.
 */
export default function Reveal({
  children,
  variant = 'rise',
  delay = 0,
  className = '',
  as: Tag = 'div',
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const on = inView || reduced

  const state =
    variant === 'wipe'
      ? on
        ? 'opacity-100 translate-y-0 [clip-path:inset(0_0_0_0)]'
        : 'opacity-0 [clip-path:inset(0_0_100%_0)]'
      : on
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-7'

  return (
    <Tag
      ref={ref as never}
      className={`${state} transition-[opacity,transform,clip-path] duration-[620ms] ease-scan motion-reduce:transition-none ${className}`}
      style={{ transitionDelay: reduced ? '0ms' : `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
