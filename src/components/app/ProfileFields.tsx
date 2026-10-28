'use client'

import { useId, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import { ALLERGENS, allergenLabel } from '@/lib/food'
import { DIET_GROUPS, DIETS, MAX_ENTRY_LENGTH, dietLabel, type DietId } from '@/lib/profile'

/*
 * Pickers follow the pattern food apps such as Fig, Yuka and MyFitnessPal
 * settled on: the handful most people need first, the rest one tap away, and
 * a search box that finds any option or adds one of your own.
 */

interface Option {
  id: string
  label: string
  hint?: string
}

// The most followed diets in the IFIC 2025 Food & Health Survey (high protein
// leads at 23%), limited to ones a label can be checked against.
const POPULAR_DIETS: DietId[] = ['high-protein', 'low-carb', 'vegetarian', 'vegan', 'gluten-free', 'keto']

// The nine major allergens U.S. law requires on labels (FDA, FASTER Act 2023).
const MAJOR_ALLERGENS = ['milk', 'eggs', 'fish', 'crustaceans', 'nuts', 'peanuts', 'gluten', 'soybeans', 'sesame-seeds']

const ALLERGEN_HINTS: Record<string, string> = {
  gluten: 'Wheat, barley, rye',
  nuts: 'Almonds, cashews, walnuts',
  crustaceans: 'Shrimp, crab, lobster',
  molluscs: 'Mussels, oysters, squid',
  celery: 'Celery, celeriac',
  'sulphur-dioxide-and-sulphites': 'Wine, dried fruit',
}

const ALLERGEN_OPTIONS: Option[] = ALLERGENS.map((a) => ({ ...a, hint: ALLERGEN_HINTS[a.id] }))

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

/** Diets: the most popular, then the rest by group, with search and room for any the list does not cover. */
export function DietPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const more = DIET_GROUPS.map((g) => ({
    label: g.label,
    options: DIETS.filter((d) => d.group === g.id && !POPULAR_DIETS.includes(d.id)),
  })).filter((g) => g.options.length > 0)

  return (
    <Picker
      value={value}
      onChange={onChange}
      options={DIETS}
      popular={{ label: 'Most popular', options: POPULAR_DIETS.map((id) => DIETS.find((d) => d.id === id)!) }}
      more={more}
      searchLabel="Search diets"
      placeholder="Search, or add your own (Whole30, Jain…)"
      toId={(w) => w}
      labelFor={dietLabel}
    />
  )
}

/** Allergens: the nine major ones, then the other common ones, with search and room for anything else. */
export function AllergenPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Picker
      value={value}
      onChange={onChange}
      options={ALLERGEN_OPTIONS}
      popular={{ label: 'Most common', options: ALLERGEN_OPTIONS.filter((a) => MAJOR_ALLERGENS.includes(a.id)) }}
      more={[{ label: 'Also common', options: ALLERGEN_OPTIONS.filter((a) => !MAJOR_ALLERGENS.includes(a.id)) }]}
      searchLabel="Search allergens and ingredients"
      placeholder="Search, or add your own (corn, mango…)"
      toId={(w) => w.toLowerCase()}
      labelFor={allergenLabel}
    />
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

function Picker({
  value,
  onChange,
  options,
  popular,
  more,
  searchLabel,
  placeholder,
  toId,
  labelFor,
}: {
  value: string[]
  onChange: (v: string[]) => void
  options: Option[]
  popular: { label: string; options: Option[] }
  more: { label: string; options: Option[] }[]
  searchLabel: string
  placeholder: string
  /** How a typed entry is stored. */
  toId: (word: string) => string
  labelFor: (id: string) => string
}) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const moreOptions = more.flatMap((g) => g.options)
  // Opens on its own when something in it is already chosen, so no choice is ever hidden.
  const [expanded, setExpanded] = useState(() => moreOptions.some((o) => value.includes(o.id)))

  const custom = value.filter((v) => !options.some((o) => o.id === v))
  const q = query.trim().toLowerCase()
  const matches = q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q)) : []
  const exact = options.find((o) => o.label.toLowerCase() === q || o.id === q)
  const canAdd = q.length > 0 && !exact && !custom.some((c) => c.toLowerCase() === q)

  const add = () => {
    const words = query
      .split(',')
      .map((w) => w.trim().slice(0, MAX_ENTRY_LENGTH))
      .filter(Boolean)
    if (!words.length) return
    const next = [...value]
    for (const w of words) {
      // Typing a listed option selects it rather than adding a duplicate.
      const known = options.find((o) => o.label.toLowerCase() === w.toLowerCase() || o.id === w.toLowerCase())
      const id = known ? known.id : toId(w)
      if (!next.some((x) => x.toLowerCase() === id.toLowerCase())) next.push(id)
    }
    onChange(next)
    setQuery('')
  }

  const grid = (list: Option[]) => (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {list.map((o) => (
        <Choice key={o.id} on={value.includes(o.id)} onClick={() => onChange(toggle(value, o.id))} label={o.label} hint={o.hint} />
      ))}
    </div>
  )

  return (
    <div className="space-y-7">
      <div>
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (matches.length === 1 && !query.includes(',')) {
                  onChange(toggle(value, matches[0].id))
                  setQuery('')
                } else add()
              } else if (e.key === 'Escape') setQuery('')
            }}
            placeholder={placeholder}
            maxLength={MAX_ENTRY_LENGTH * 4}
            autoComplete="off"
            className="field w-full pl-10"
          />
        </div>

        {custom.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Added by you">
            {custom.map((w) => (
              <li key={w}>
                <span className="inline-flex h-9 items-center gap-1 rounded-full bg-accent-soft pl-3.5 pr-1 text-sm font-medium text-accent-ink">
                  {labelFor(w)}
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((x) => x !== w))}
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

      {q ? (
        <section aria-live="polite">
          <h4 className="t-eyebrow">{matches.length ? `${matches.length} match${matches.length > 1 ? 'es' : ''}` : 'No matches'}</h4>
          {matches.length > 0 && grid(matches)}
          {canAdd && (
            <button
              type="button"
              onClick={add}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-paper px-4 text-sm font-medium shadow-neu-sm transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-neu-hover active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add &ldquo;{query.trim().slice(0, MAX_ENTRY_LENGTH)}&rdquo;
            </button>
          )}
        </section>
      ) : (
        <>
          <section>
            <h4 className="t-eyebrow">{popular.label}</h4>
            {grid(popular.options)}
          </section>

          {expanded &&
            more.map((g) => (
              <section key={g.label}>
                <h4 className="t-eyebrow">{g.label}</h4>
                {grid(g.options)}
              </section>
            ))}

          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="-mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-2 underline decoration-ink/25 underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            {expanded ? 'Show fewer' : `Show ${moreOptions.length} more`}
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
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
