import { useId } from 'react'

/** Hand-drawn produce for the landing hero. Decorative only. */

type ArtProps = { className?: string }

function useGradientId() {
  return useId().replace(/:/g, '')
}

export function Apple({ className = '' }: ArtProps) {
  const id = useGradientId()
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="35%" cy="35%" r="75%">
          <stop offset="0" stopColor="#F47C68" />
          <stop offset="0.55" stopColor="#DC423A" />
          <stop offset="1" stopColor="#A82A2C" />
        </radialGradient>
      </defs>
      <path d="M50 30C38 22 18 26 16 48c-2 22 14 44 26 42 4-1 6-3 8-3s4 2 8 3c12 2 28-20 26-42-2-22-22-26-34-18Z" fill={`url(#${id})`} />
      <path d="M50 30c0-8 2-14 6-18" stroke="#6B4A2F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M53 20c7-10 21-10 25-6-6 10-18 12-25 6Z" fill="#6FA35A" />
      <ellipse cx="32" cy="45" rx="5.5" ry="11" fill="#fff" opacity="0.3" transform="rotate(-25 32 45)" />
    </svg>
  )
}

export function Avocado({ className = '' }: ArtProps) {
  const id = useGradientId()
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EEF0B0" />
          <stop offset="1" stopColor="#B5D267" />
        </linearGradient>
        <radialGradient id={`${id}-p`} cx="38%" cy="35%" r="70%">
          <stop offset="0" stopColor="#B07848" />
          <stop offset="1" stopColor="#6E4022" />
        </radialGradient>
      </defs>
      <path d="M50 6c14 0 20 20 26 38 8 24-4 50-26 50S16 68 24 44C30 26 36 6 50 6Z" fill="#3E5B26" />
      <path d="M50 13c11 0 15 17 20 33 7 21-3 42-20 42S23 67 30 46c5-16 9-33 20-33Z" fill={`url(#${id}-f)`} />
      <circle cx="50" cy="62" r="15" fill={`url(#${id}-p)`} />
      <ellipse cx="45" cy="56" rx="4" ry="6" fill="#fff" opacity="0.25" transform="rotate(-20 45 56)" />
    </svg>
  )
}

export function Carrot({ className = '' }: ArtProps) {
  const id = useGradientId()
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB054" />
          <stop offset="1" stopColor="#EE741C" />
        </linearGradient>
      </defs>
      <g stroke="#5E9E48" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M30 34C22 22 18 14 14 10" />
        <path d="M34 32c-2-12 0-22 4-28" />
        <path d="M30 36c-10-4-18-6-24-4" />
      </g>
      <path d="M30 34c8-8 20-6 26 2l28 50c2 4-2 6-6 3L28 52c-6-6-4-12 2-18Z" fill={`url(#${id})`} />
      <g stroke="#D9661A" strokeWidth="2" strokeLinecap="round">
        <path d="m40 44 6-3" />
        <path d="m52 57 6-4" />
        <path d="m63 71 5-3" />
      </g>
    </svg>
  )
}

export function Strawberry({ className = '' }: ArtProps) {
  const id = useGradientId()
  const seeds = [
    [38, 46], [50, 44], [62, 46], [32, 58], [44, 58], [56, 58], [68, 58], [40, 70], [52, 71], [62, 69], [48, 82],
  ]
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#F6675B" />
          <stop offset="1" stopColor="#C42634" />
        </radialGradient>
      </defs>
      <path d="M50 30c18-4 34 6 30 24-4 20-20 36-30 38-10-2-26-18-30-38-4-18 12-28 30-24Z" fill={`url(#${id})`} />
      {seeds.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.6" ry="2.4" fill="#FCE3A0" />
      ))}
      <path d="M50 31 37 22l8 8-12 4h34l-12-4 8-8Z" fill="#4F9A45" />
      <path d="M50 30v-12" stroke="#4F9A45" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

export function Lemon({ className = '' }: ArtProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="#F2C531" />
      <circle cx="50" cy="50" r="36" fill="#FBE58A" />
      <g stroke="#F2C531" strokeWidth="3" strokeLinecap="round">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4
          return <path key={i} d={`M50 50 L${(50 + Math.cos(a) * 33).toFixed(1)} ${(50 + Math.sin(a) * 33).toFixed(1)}`} />
        })}
      </g>
      <circle cx="50" cy="50" r="4" fill="#F2C531" />
    </svg>
  )
}
