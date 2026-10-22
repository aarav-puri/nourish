import { useId } from 'react'

interface OliveAvatarProps {
  /** Rendered width and height in pixels. */
  size?: number
  /** Idle motion: a slow sway on the sprig and the odd blink. */
  animated?: boolean
  /** A quicker bob with eyes glancing about, while an answer is on its way. */
  thinking?: boolean
  className?: string
}

/**
 * Olive, the Nourish assistant: a small olive hanging from a sage sprig.
 * Decorative only; the name always appears in text beside it.
 */
export default function OliveAvatar({ size = 32, animated = true, thinking = false, className = '' }: OliveAvatarProps) {
  const id = useId().replace(/:/g, '')
  const state = thinking ? 'olive-thinking' : animated ? 'olive-idle' : ''

  return (
    <span
      aria-hidden="true"
      className={`olive-avatar ${state} inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <defs>
          <radialGradient id={`${id}-body`} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#B7CC7E" />
            <stop offset="0.55" stopColor="#86A24C" />
            <stop offset="1" stopColor="#5B7731" />
          </radialGradient>
        </defs>

        {/* Everything hangs from the sprig's tip, so it sways from there. */}
        <g className="olive-sway">
          <path d="M24 4.5c0 4 .6 6.6 1.6 9" stroke="rgb(var(--accent))" strokeWidth="2" strokeLinecap="round" />
          <path
            className="olive-leaf"
            d="M25 8.5c3.6-3.6 9-4.2 13.5-2.2-2.4 4.6-7.6 6.6-13.5 2.2Z"
            fill="rgb(var(--accent))"
            opacity="0.85"
          />

          <g className="olive-body">
            <ellipse cx="25" cy="28" rx="12.5" ry="14.5" fill={`url(#${id}-body)`} />
            <ellipse cx="20" cy="20.5" rx="3.6" ry="2.2" fill="#fff" opacity="0.35" transform="rotate(-30 20 20.5)" />

            <g className="olive-eyes">
              <ellipse className="olive-eye" cx="20.6" cy="28" rx="1.55" ry="2" fill="#24331A" />
              <ellipse className="olive-eye" cx="29.4" cy="28" rx="1.55" ry="2" fill="#24331A" />
            </g>
            <circle cx="17.6" cy="32" r="1.9" fill="#F2A08B" opacity="0.45" />
            <circle cx="32.4" cy="32" r="1.9" fill="#F2A08B" opacity="0.45" />
            <path d="M22.6 32.4c1.4 1.4 3.4 1.4 4.8 0" stroke="#24331A" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </span>
  )
}
