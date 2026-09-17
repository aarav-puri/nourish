'use client'

import { ThinkingOrb, type OrbState } from 'thinking-orbs'

interface OrbProps {
  /** Which animation to play. Pick the verb that matches the wait. */
  state?: OrbState
  /** 20 for inline with text and inside buttons, 64 for page and panel loaders. */
  size?: 20 | 64
  /**
   * The app is dark, so the orb defaults to light dots. Use `onLight` when it
   * sits on a white surface such as `btn-primary`.
   */
  tone?: 'onDark' | 'onLight'
  /** Announced to screen readers. Leave unset when nearby text already says it. */
  label?: string
  className?: string
}

/** The loading indicator used everywhere in place of a spinning circle. */
export default function Orb({ state = 'working', size = 20, tone = 'onDark', label, className }: OrbProps) {
  return (
    <ThinkingOrb
      state={state}
      size={size}
      theme={tone === 'onLight' ? 'light' : 'dark'}
      className={`shrink-0 ${className ?? ''}`}
      {...(label ? { 'aria-label': label } : { 'aria-hidden': true })}
    />
  )
}
