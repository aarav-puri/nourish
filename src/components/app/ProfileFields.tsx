'use client'

import { useId, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { ALLERGENS, allergenLabel } from '@/lib/food'
import { DIET_GROUPS, DIETS, MAX_ENTRY_LENGTH, dietLabel, isKnownDiet } from '@/lib/profile'

// The nine major allergens U.S. law requires on labels (FDA, FASTER Act 2023).
// Anything else is typed in.
const MAJOR_ALLERGENS = ['milk', 'eggs', 'fish', 'crustaceans', 'nuts', 'peanuts', 'gluten', 'soybeans', 'sesame-seeds']

const ALLERGEN_HINTS: Record<string, string> = {
  gluten: 'Wheat, barley, rye',
  nuts: 'Almonds, cashews, walnuts',
  crustaceans: 'Shrimp, crab, lobster',
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

/** Diets, grouped, with room for any the list does not cover. */
export function DietPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const custom = value.filter((d) => !isKnownDiet(d))

  return (
    <div className="space-y-7">
      {DIET_GROUPS.map((g) => (
        <fieldset key={g.id}>
          <legend className="t-eyebrow">{g.label}</legend>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DIETS.filter((d) => d.group === g.id).map((d) => (
              <Choice key={d.id} on={value.includes(d.id)} onClick={() => onChange(toggle(value, d.id))} label={d.label} hint={d.hint} />
            ))}
          </div>
        </fieldset>
      ))}

      <AddYourOwn
        label="Something else?"
        placeholder="Whole30, low FODMAP, Jain…"
        custom={custom}
        onAdd={(words) => {
          const next = [...value]
          for (const w of words) {
            // Typing a listed diet selects it rather than adding a duplicate.
            const known = DIETS.find((d) => d.label.toLowerCase() === w.toLowerCase())
            const id = known ? known.id : w
            if (!next.some((x) => x.toLowerCase() === id.toLowerCase())) next.push(id)
          }
          onChange(next)
        }}
        onRemove={(w) => onChange(value.filter((x) => x !== w))}
        labelFor={dietLabel}
      />
    </div>
  )
}

/** The nine major allergens, then anything typed in. */
export function AllergenPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  // Everything outside the nine shows as a removable pill, including ones saved before the list was trimmed.
  const custom = value.filter((a) => !MAJOR_ALLERGENS.includes(a))

  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="sr-only">Common allergens</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MAJOR_ALLERGENS.map((id) => (
            <Choice key={id} on={value.includes(id)} onClick={() => onChange(toggle(value, id))} label={allergenLabel(id)} hint={ALLERGEN_HINTS[id]} />
          ))}
        </div>
      </fieldset>

      <AddYourOwn
        label="Anything else you avoid?"
        placeholder="Mustard, strawberries, corn…"
        custom={custom}
        onAdd={(words) => {
          const next = [...value]
          for (const w of words) {
            const known = ALLERGENS.find((a) => a.label.toLowerCase() === w.toLowerCase() || a.id === w.toLowerCase())
            const id = known ? known.id : w.toLowerCase()
            if (!next.includes(id)) next.push(id)
          }
          onChange(next)
        }}
        onRemove={(w) => onChange(value.filter((x) => x !== w))}
        labelFor={allergenLabel}
      />
    </div>
  )
}

/** Both pickers in one card, for Settings. */
export default function ProfileFields({
  diets,
  avoid,
  onDiets,
  onAvoid,
}: {
  diets: string[]
  avoid: string[]
  onDiets: (v: string[]) => void
  onAvoid: (v: string[]) => void
}) {
  return (
    <>
      <h3 className="font-display text-lg font-bold tracking-tight">Diets you follow</h3>
      <div className="mt-4">
        <DietPicker value={diets} onChange={onDiets} />
      </div>
      <h3 className="mt-10 border-t border-line pt-8 font-display text-lg font-bold tracking-tight">Allergens and ingredients you avoid</h3>
      <div className="mt-4">
        <AllergenPicker value={avoid} onChange={onAvoid} />
      </div>
    </>
  )
}

function Choice({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-14 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-[transform,box-shadow,background-color] duration-150 active:scale-[0.98] ${
        on ? 'border-transparent bg-paper text-accent-ink shadow-neu-inset' : 'border-transparent bg-paper shadow-neu-sm hover:-translate-y-px hover:shadow-neu-hover'
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
          on ? 'bg-accent text-on-accent shadow-neu-sm' : 'shadow-neu-inset-sm'
        }`}
      >
        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {hint && <span className={`mt-0.5 block text-xs leading-tight ${on ? 'text-ink-2' : 'text-ink-3'}`}>{hint}</span>}
      </span>
    </button>
  )
}

/** A field for entries the lists do not cover. Commas add several at once. */
function AddYourOwn({
  label,
  placeholder,
  custom,
  onAdd,
  onRemove,
  labelFor,
}: {
  label: string
  placeholder: string
  custom: string[]
  onAdd: (words: string[]) => void
  onRemove: (word: string) => void
  labelFor: (id: string) => string
}) {
  const id = useId()
  const [text, setText] = useState('')

  const add = () => {
    const words = text
      .split(',')
      .map((w) => w.trim().slice(0, MAX_ENTRY_LENGTH))
      .filter(Boolean)
    if (!words.length) return
    onAdd(words)
    setText('')
  }

  return (
    <div>
      <label htmlFor={id} className="t-eyebrow">
        {label}
      </label>
      <div className="mt-3 flex gap-2">
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          maxLength={MAX_ENTRY_LENGTH * 4}
          autoComplete="off"
          className="field min-w-0 flex-1"
        />
        <button type="button" onClick={add} disabled={!text.trim()} className="btn-secondary h-12 shrink-0 gap-1.5 px-4 disabled:opacity-50">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>

      {custom.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Added by you">
          {custom.map((w) => (
            <li key={w}>
              <span className="inline-flex h-9 items-center gap-1 rounded-full bg-accent-soft pl-3.5 pr-1 text-sm font-medium text-accent-ink">
                {labelFor(w)}
                <button
                  type="button"
                  onClick={() => onRemove(w)}
                  aria-label={`Remove ${labelFor(w)}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-ink/[0.06]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
