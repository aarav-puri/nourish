import type { Grade } from '@/lib/food'

const LETTERS: Grade[] = ['a', 'b', 'c', 'd', 'e']

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

/**
 * The A to E scale as printed on packs: every step visible, the product's own
 * grade raised out of the row so its position on the scale reads at a glance.
 */
export function GradeScale({ grade, label }: { grade: Grade | null; label: string }) {
  return (
    <div role="img" aria-label={grade ? `${label}: ${grade.toUpperCase()} on a scale from A to E` : `${label}: not graded`} className="flex items-center gap-1">
      {LETTERS.map((l) => {
        const active = l === grade
        return (
          <span
            key={l}
            aria-hidden="true"
            className={`flex items-center justify-center font-semibold uppercase transition-all ${
              active
                ? `h-12 w-10 rounded-lg text-xl shadow-card ring-2 ring-surface ${GRADE_STYLE[l]}`
                : `h-8 w-7 rounded-md text-xs ${grade ? 'opacity-35' : 'opacity-20'} ${GRADE_STYLE[l]}`
            }`}
          >
            {l}
          </span>
        )
      })}
    </div>
  )
}
