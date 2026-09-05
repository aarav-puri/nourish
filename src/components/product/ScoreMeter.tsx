/**
 * The scan readout, drawn the way the landing page promises it.
 *
 * The number is derived from the published grade on the product record, not
 * invented here. A product with no grade says so rather than showing a made
 * up number.
 */

const GRADE_TO_SCORE: Record<string, number> = {
  a: 90,
  b: 72,
  c: 55,
  d: 38,
  e: 20,
}

const SEGMENTS = 40

export function scoreFromGrade(grade?: string): number | null {
  if (!grade) return null
  return GRADE_TO_SCORE[grade.toLowerCase()] ?? null
}

export default function ScoreMeter({ grade }: { grade?: string }) {
  const score = scoreFromGrade(grade)

  if (score === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <p className="text-xs font-bold uppercase tracking-label text-zinc-500">Health read</p>
        <p className="mt-3 font-display text-2xl font-bold tracking-tight text-zinc-400">
          Not scored
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          We don&rsquo;t have a score for this one yet. The ingredients and nutrition below still
          apply.
        </p>
      </div>
    )
  }

  const filled = Math.round((score / 100) * SEGMENTS)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="text-xs font-bold uppercase tracking-label text-zinc-500">Health read</p>

      <div className="mt-4 flex items-end gap-4">
        <span className="tnum font-display text-6xl font-bold leading-none tracking-tightest">
          {score}
        </span>
        <span className="pb-2 text-xs font-bold uppercase tracking-label text-zinc-500">
          / 100
        </span>
      </div>

      {/* The same segmented meter the landing page shows. */}
      <div className="mt-5 flex h-2 w-full gap-[3px]" aria-hidden="true">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className={`flex-1 ${i < filled ? 'bg-white' : 'bg-white/15'}`}
          />
        ))}
      </div>
    </div>
  )
}
