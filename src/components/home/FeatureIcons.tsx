import type { SVGProps } from 'react'

/*
 * Landing icons, drawn for Nourish on one 32px grid: a 1.6px rounded stroke in
 * the accent ink, and a single soft sage fill that marks what the icon is about.
 */

type IconProps = SVGProps<SVGSVGElement>

function Glyph({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={32}
      height={32}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

const soft = 'fill-accent/25 stroke-none'

/** A tall grade tile beside the lower grades: the score out of 100. */
export function GradeIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <rect x="2.5" y="6.5" width="10" height="19" rx="3" className={soft} />
      <rect x="2.5" y="6.5" width="10" height="19" rx="3" />
      <rect x="15.5" y="11" width="3.4" height="10" rx="1.2" />
      <rect x="21" y="11" width="3.4" height="10" rx="1.2" />
      <rect x="26.5" y="11" width="3.4" height="10" rx="1.2" />
    </Glyph>
  )
}

/** A whole grain, then the same grain worked into layers: how processed it is. */
export function ProcessIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <ellipse cx="9" cy="16" rx="5.5" ry="9" className={soft} />
      <ellipse cx="9" cy="16" rx="5.5" ry="9" />
      <path d="M9 10v12" />
      <path d="M19 9.5h10M19 16h10M19 22.5h10" />
    </Glyph>
  )
}

/** A pack label with a tick: checked against your diet and allergies. */
export function MatchIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M7 4.5h13l5 5v18H7z" className={soft} />
      <path d="M7 4.5h13l5 5v18H7z" />
      <path d="M20 4.5v5h5" />
      <path d="m11.5 18.5 3 3 6-6.5" />
    </Glyph>
  )
}

/** One product handed for another. */
export function SwapIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="22" cy="22" r="5" className={soft} />
      <circle cx="10" cy="10" r="5" />
      <circle cx="22" cy="22" r="5" />
      <path d="M17 7.5c3.5 0 6.5 2.5 7 6M24 13.5l-2.2-1.6M24 13.5l1.6-2.3" />
      <path d="M15 24.5c-3.5 0-6.5-2.5-7-6M8 18.5l2.2 1.6M8 18.5l-1.6 2.3" />
    </Glyph>
  )
}

/** A question with an olive in it: ask Olive. */
export function AskIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 8.5a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-9l-6 5v-5a3 3 0 0 1-3-3z" />
      <ellipse cx="16" cy="13.5" rx="3.6" ry="4.6" transform="rotate(-30 16 13.5)" className={soft} />
      <ellipse cx="16" cy="13.5" rx="3.6" ry="4.6" transform="rotate(-30 16 13.5)" />
      <path d="M18.4 9.4c.9-1.4 2.3-2.2 4-2.3" />
    </Glyph>
  )
}
