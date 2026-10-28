import { SCORE_BANDS, type Grade } from '@/lib/food'

// Background and legible foreground for each step of the ramp.
export const GRADE_STYLE: Record<Grade, string> = {
  a: 'bg-grade-a text-white',
  b: 'bg-grade-b text-[#14210a]',
  c: 'bg-grade-c text-[#2b2200]',
  d: 'bg-grade-d text-[#2a1600]',
  e: 'bg-grade-e text-white',
}

/** A single grade letter on its colour, for lists and tiles. */
export function GradeBadge({ grade, size = 'md', className = '' }: { grade: Grade | null; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = { sm: 'h-6 w-6 text-xs rounded-md', md: 'h-9 w-9 text-base rounded-lg', lg: 'h-14 w-14 text-2xl rounded-xl' }[size]
  if (!grade) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center border border-dashed border-line font-mono text-ink-3 ${dims} ${className}`}>
        <span aria-hidden="true">?</span>
        <span className="sr-only">Not graded</span>
      </span>
    )
  }
  return (
    <span className={`inline-flex shrink-0 items-center justify-center font-semibold uppercase ${GRADE_STYLE[grade]} ${dims} ${className}`}>
      <span aria-hidden="true">{grade}</span>
      <span className="sr-only">Grade {grade.toUpperCase()}</span>
    </span>
  )
}

/** The health score out of 100 on its grade's color, for lists and tiles. */
export function ScoreBadge({ grade, score, size = 'md', className = '' }: { grade: Grade | null; score: number | null; size?: 'sm' | 'md'; className?: string }) {
  const dims = { sm: 'h-6 min-w-[1.75rem] px-1 text-[11px] rounded-md', md: 'h-9 min-w-[2.5rem] px-1.5 text-sm rounded-lg' }[size]
  if (!grade || score === null) return <GradeBadge grade={null} size={size} className={className} />
  return (
    <span className={`tnum inline-flex shrink-0 items-center justify-center font-semibold ${GRADE_STYLE[grade]} ${dims} ${className}`}>
      <span aria-hidden="true">{score}</span>
      <span className="sr-only">Health score {score} out of 100</span>
    </span>
  )
}

/**
 * The score out of 100 on a track colored by grade band, with a marker where
 * the product sits, so a 62 reads as just inside the good side at a glance.
 */
export function ScoreMeter({ grade, score }: { grade: Grade | null; score: number | null }) {
  if (!grade || score === null) {
    return <p className="font-display font-bold text-2xl leading-none text-ink-2">Not scored</p>
  }
  return (
    <div className="w-full">
      <p className="flex items-baseline gap-1.5">
        <span className="tnum font-display text-6xl font-bold leading-none tracking-[-0.04em]">{score}</span>
        <span className="font-mono text-sm text-ink-3">/100</span>
      </p>
      <div
        role="meter"
        aria-label="Health score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        className="relative mt-4 flex h-2.5 gap-[3px]"
      >
        {(['e', 'd', 'c', 'b', 'a'] as Grade[]).map((g) => {
          const [lo, hi] = SCORE_BANDS[g]
          return (
            <span
              key={g}
              aria-hidden="true"
              className={`rounded-full ${GRADE_STYLE[g].split(' ')[0]} ${g === grade ? '' : 'opacity-30'}`}
              style={{ flex: hi - lo + 1 }}
            />
          )
        })}
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface shadow-card"
          style={{ left: `${score}%`, background: 'rgb(var(--ink))' }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-2xs text-ink-3" aria-hidden="true">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  )
}
