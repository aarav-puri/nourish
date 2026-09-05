import { scoreFromGrade } from './ScoreMeter'

/**
 * The footprint, shown against the scale the way the landing page shows it.
 * Only the product's own bar comes from data. The other two are the fixed
 * ends of the rating scale, so nothing here implies a measurement we do not
 * have.
 */
export default function EcoBars({ grade }: { grade?: string }) {
  const score = scoreFromGrade(grade)
  if (score === null) return null

  const rows = [
    { label: 'This product', value: score, strong: true },
    { label: 'Best possible', value: 90, strong: false },
    { label: 'Lowest possible', value: 20, strong: false },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="text-xs font-bold uppercase tracking-label text-zinc-500">Eco impact</p>
      <div className="mt-5">
        {rows.map((r, i) => (
          <div key={r.label} className="mb-5 last:mb-0">
            <div className="mb-2 flex justify-between gap-4 font-mono text-[11px] uppercase tracking-label">
              <span className="text-zinc-500">{r.label}</span>
              <span className={r.strong ? 'font-bold text-white' : 'text-zinc-400'}>
                {r.value} / 100
              </span>
            </div>
            <div className="h-3 w-full bg-white/10">
              <span
                className={`block h-full ${i === 0 ? 'bg-white' : 'bg-white/35'}`}
                style={{ width: `${r.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
