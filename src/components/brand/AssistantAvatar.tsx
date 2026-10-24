interface AssistantAvatarProps {
  /** Rendered width and height in pixels. */
  size?: number
  /** Idle motion: a slow twinkle on the star. */
  animated?: boolean
  /** A quicker wave of the wand, while an answer is on its way. */
  thinking?: boolean
  className?: string
}

/**
 * NourishAI, the Nourish assistant: the Iconsax "magic-star" (bulk), a star at
 * the tip of a wand. Decorative only; the name always appears in text beside it.
 */
export default function AssistantAvatar({ size = 32, animated = true, thinking = false, className = '' }: AssistantAvatarProps) {
  const state = thinking ? 'assistant-thinking' : animated ? 'assistant-idle' : ''
  const glyph = Math.round(size * 0.58)

  return (
    <span
      aria-hidden="true"
      className={`assistant-avatar ${state} inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill="none">
        <g className="assistant-wand">
          <path
            className="assistant-star"
            d="m17.29 4.141-.07 3.79c-.01.52.32 1.21.74 1.52l2.48 1.88c1.59 1.2 1.33 2.67-.57 3.27l-3.23 1.01c-.54.17-1.11.76-1.25 1.31l-.77 2.94c-.61 2.32-2.13 2.55-3.39.51l-1.76-2.85c-.32-.52-1.08-.91-1.68-.88l-3.34.17c-2.39.12-3.07-1.26-1.51-3.08l1.98-2.3c.37-.43.54-1.23.37-1.77l-1.01-3.23c-.59-1.9.47-2.95 2.36-2.33l2.95.97c.5.16 1.25.05 1.67-.26l3.08-2.22c1.66-1.2 2.99-.5 2.95 1.55Z"
            fill="currentColor"
          />
          <path
            opacity=".4"
            d="m21.44 20.47-3.03-3.03a.754.754 0 0 0-1.06 0c-.29.29-.29.77 0 1.06l3.03 3.03c.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77 0-1.06Z"
            fill="currentColor"
          />
        </g>
      </svg>
    </span>
  )
}
