'use client'

import { Check } from 'lucide-react'
import { ALLERGENS } from '@/lib/food'
import { DIETS, type DietId } from '@/lib/profile'

/** The diet and allergen pickers, shared by Settings and first-run setup. */
export default function ProfileFields({
  diets,
  avoid,
  onDiets,
  onAvoid,
}: {
  diets: DietId[]
  avoid: string[]
  onDiets: (v: DietId[]) => void
  onAvoid: (v: string[]) => void
}) {
  const toggle = <T,>(list: T[], set: (v: T[]) => void, v: T) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <>
      <h3 className="t-eyebrow">Diets you follow</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DIETS.map((d) => (
          <Toggle key={d.id} on={diets.includes(d.id)} onClick={() => toggle(diets, onDiets, d.id)} label={d.label} hint={d.hint} />
        ))}
      </div>

      <h3 className="t-eyebrow mt-7">Allergens and ingredients you avoid</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALLERGENS.map((a) => (
          <Toggle key={a.id} on={avoid.includes(a.id)} onClick={() => toggle(avoid, onAvoid, a.id)} label={a.label} />
        ))}
      </div>
    </>
  )
}

function Toggle({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
        on ? 'border-transparent bg-paper text-accent-ink shadow-neu-inset' : 'border-transparent bg-paper shadow-neu-sm hover:-translate-y-px hover:shadow-neu-hover'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          on ? 'border-transparent bg-accent text-on-accent shadow-neu-sm' : 'border-transparent shadow-neu-inset-sm'
        }`}
      >
        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {hint && <span className={`block text-xs leading-tight ${on ? 'text-ink-2' : 'text-ink-3'}`}>{hint}</span>}
      </span>
    </button>
  )
}
