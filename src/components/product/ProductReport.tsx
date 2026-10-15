'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRightLeft,
  ChefHat,
  CircleCheck,
  CircleDashed,
  Leaf,
  ListChecks,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  GRADE_INFO,
  NOVA_INFO,
  allergenLabel,
  fmt,
  keyPoints,
  type Food,
  type Level,
} from '@/lib/food'
import { DIETS, checkProduct, dietLabel, isProfileEmpty, overallStatus, type Check, type CheckStatus } from '@/lib/profile'
import { INSIGHT_TITLES, type InsightKind } from '@/lib/ai-service'
import { GradeScale } from '@/components/product/Grade'
import InsightResults from '@/components/product/InsightResults'
import { useInsights } from '@/components/product/useInsights'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Thinking, { PixelGrid } from '@/components/ui/Thinking'

/* ===================================================================== */

export default function ProductReport({ food, actions }: { food: Food; actions?: React.ReactNode }) {
  const { profile } = useAuth()
  const checks = useMemo(() => checkProduct(food, profile), [food, profile])
  const points = useMemo(() => keyPoints(food), [food])

  return (
    <article aria-labelledby="product-name" className="animate-rise">
      <ProductHeader food={food} actions={actions} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-6">
        <div className="space-y-4">
          <Verdict food={food} points={points} />
          <ForYou checks={checks} profileEmpty={isProfileEmpty(profile)} />
          <AskAI food={food} />
        </div>
        <div className="space-y-4">
          <NutritionPanel food={food} />
          <Processing food={food} />
          <Ingredients food={food} />
          <Footnote food={food} />
        </div>
      </div>
    </article>
  )
}

/* ---------- Header ---------------------------------------------------- */

function ProductHeader({ food, actions }: { food: Food; actions?: React.ReactNode }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <header className="flex items-start gap-4 sm:gap-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-neu-sm sm:h-24 sm:w-24">
        {food.image && imgOk ? (
          // Product photos come from many hosts at unknown sizes, so a plain
          // img with lazy decoding beats routing them through the optimiser.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.image}
            alt=""
            className="h-full w-full object-contain p-1.5"
            decoding="async"
            onError={() => setImgOk(false)}
          />
        ) : (
          <Package className="h-7 w-7 text-ink-3" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        {food.brand && food.brand.toLowerCase() !== food.name.toLowerCase() && (
          <p className="truncate text-sm font-medium text-ink-2">{food.brand}</p>
        )}
        <h1 id="product-name" className="mt-0.5 font-display font-bold text-[1.55rem] leading-[1.1] tracking-[-0.015em] text-balance sm:text-[2rem]">
          {food.name}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-3">
          {food.quantity && <span>{food.quantity}</span>}
          {food.barcode && <span>{food.barcode}</span>}
          {food.manual && <span>Entered by hand</span>}
        </p>
      </div>
      {actions && <div className="hidden shrink-0 sm:block">{actions}</div>}
    </header>
  )
}

/* ---------- Verdict --------------------------------------------------- */

function Verdict({ food, points }: { food: Food; points: ReturnType<typeof keyPoints> }) {
  const info = food.grade ? GRADE_INFO[food.grade] : null
  return (
    <section aria-labelledby="verdict-h" className="card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="verdict-h" className="t-eyebrow">
            Nutri-Score
          </h2>
          {food.gradeEstimated && <span className="chip py-0.5 text-[11px]">Estimated by AI</span>}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <GradeScale grade={food.grade} label="Nutri-Score" />
          {info ? (
            <p className="font-display font-bold text-3xl leading-none">{info.label}</p>
          ) : (
            <p className="font-display font-bold text-2xl leading-none text-ink-2">Not graded</p>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          {info
            ? info.summary
            : 'There is no published grade for this product, and not enough data to estimate one. The details below still apply.'}
        </p>
      </div>

      {points.length > 0 && (
        <ul className="border-t border-line px-5 py-3 sm:px-6">
          {points.map((p) => (
            <li key={p.text} className="flex items-center gap-2.5 py-1.5 text-sm">
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${p.tone === 'bad' ? 'bg-level-high' : 'bg-level-low'}`}
              />
              <span className="sr-only">{p.tone === 'bad' ? 'Concern:' : 'Strength:'}</span>
              {p.text}
            </li>
          ))}
        </ul>
      )}

      {food.highlights.length > 0 && (
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <p className="t-eyebrow">Worth knowing</p>
          <ul className="mt-2 space-y-1.5">
            {food.highlights.slice(0, 3).map((h) => (
              <li key={h} className="text-sm leading-relaxed text-ink-2">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/* ---------- For you --------------------------------------------------- */

const STATUS: Record<CheckStatus, { title: string; icon: LucideIcon; banner: string; dot: LucideIcon; dotClass: string }> = {
  conflict: {
    title: 'Does not fit your profile',
    icon: ShieldAlert,
    banner: 'bg-[#B8340D] text-white',
    dot: TriangleAlert,
    dotClass: 'text-level-high',
  },
  caution: {
    title: 'Check the pack before buying',
    icon: ShieldQuestion,
    banner: 'bg-level-moderate text-[#2b2200]',
    dot: TriangleAlert,
    dotClass: 'text-[rgb(var(--level-moderate))]',
  },
  unknown: {
    title: 'Mostly fits, some unknowns',
    icon: ShieldQuestion,
    banner: 'bg-surface-3 text-ink',
    dot: CircleDashed,
    dotClass: 'text-ink-3',
  },
  ok: {
    title: 'Fits your profile',
    icon: ShieldCheck,
    banner: 'bg-[#16703C] text-white',
    dot: CircleCheck,
    dotClass: 'text-level-low',
  },
}

function ForYou({ checks, profileEmpty }: { checks: Check[]; profileEmpty: boolean }) {
  if (profileEmpty) {
    return (
      <section aria-labelledby="foryou-h" className="card flex items-start gap-4 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="foryou-h" className="font-semibold">
            Get warnings made for you
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            Tell Nourish your diet and what you avoid, and every scan checks itself against it.
          </p>
          <Link href="/settings#profile" className="mt-3 inline-flex text-sm font-medium text-accent-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            Set up your food profile
          </Link>
        </div>
      </section>
    )
  }

  const status = overallStatus(checks) ?? 'ok'
  const s = STATUS[status]
  return (
    <section aria-labelledby="foryou-h" className="card overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-3.5 ${s.banner}`}>
        <s.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <h2 id="foryou-h" className="font-semibold">
          {s.title}
        </h2>
      </div>
      <ul className="divide-y divide-line">
        {checks.map((c) => {
          const cs = STATUS[c.status]
          return (
            <li key={c.key} className="flex items-start gap-3 px-5 py-3">
              <cs.dot className={`mt-0.5 h-4 w-4 shrink-0 ${cs.dotClass}`} aria-hidden="true" />
              <div className="min-w-0 text-sm">
                <p className="font-medium">{c.title}</p>
                {c.detail && <p className="mt-0.5 text-ink-2">{c.detail}</p>}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-line px-5 py-2.5">
        <Link href="/settings#profile" className="text-xs font-medium text-ink-3 hover:text-ink">
          Edit your profile
        </Link>
      </div>
    </section>
  )
}

/* ---------- Nutrition panel ------------------------------------------ */

const LEVEL_STYLE: Record<Level, { label: string; bar: string; text: string }> = {
  low: { label: 'Low', bar: 'bg-level-low', text: 'text-level-low' },
  moderate: { label: 'Medium', bar: 'bg-level-moderate', text: 'text-[rgb(var(--ink-2))]' },
  high: { label: 'High', bar: 'bg-level-high', text: 'text-level-high' },
}

// Bars are scaled to roughly twice the FSA "high" threshold, so a high
// reading fills well past halfway and a low one barely registers.
const BAR_MAX = { fat: 35, saturatedFat: 10, sugars: 45, salt: 3 }

function NutritionPanel({ food }: { food: Food }) {
  const n = food.nutrition
  const unit = food.isBeverage ? '100ml' : '100g'
  const hasAny = Object.values(n).some((v) => v !== undefined)

  const rows: { key: keyof typeof n; label: string; value?: number; digits?: number; indent?: boolean; level?: Level; max?: number }[] = [
    { key: 'fat', label: 'Fat', value: n.fat, level: food.levels.fat, max: BAR_MAX.fat },
    { key: 'saturatedFat', label: 'Saturates', value: n.saturatedFat, indent: true, level: food.levels.saturatedFat, max: BAR_MAX.saturatedFat },
    { key: 'carbs', label: 'Carbohydrate', value: n.carbs },
    { key: 'sugars', label: 'Sugars', value: n.sugars, indent: true, level: food.levels.sugars, max: BAR_MAX.sugars },
    { key: 'fiber', label: 'Fibre', value: n.fiber },
    { key: 'protein', label: 'Protein', value: n.protein },
    { key: 'salt', label: 'Salt', value: n.salt, digits: 2, level: food.levels.salt, max: BAR_MAX.salt },
  ]

  return (
    <section aria-labelledby="nutrition-h" className="card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="nutrition-h" className="text-2xl font-black tracking-tight">
          Nutrition
        </h2>
        <span className="font-mono text-xs text-ink-3">per {unit}</span>
      </div>
      <div className="rule-heavy mt-2" aria-hidden="true" />

      {!hasAny ? (
        <p className="py-6 text-sm text-ink-2">No nutrition facts have been published for this product.</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between border-b-[3px] border-ink py-2.5">
            <span className="font-bold">Energy</span>
            <span className="tnum font-mono text-lg font-semibold">
              {n.energyKcal !== undefined ? `${n.energyKcal} kcal` : '–'}
            </span>
          </div>
          <table className="w-full text-sm">
            <caption className="sr-only">Nutrition per {unit}, with traffic-light levels</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Nutrient</th>
                <th scope="col">Amount</th>
                <th scope="col">Level</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const style = r.level ? LEVEL_STYLE[r.level] : null
                return (
                  <tr key={r.key} className="border-b border-line last:border-b-0">
                    <th scope="row" className={`py-2.5 text-left ${r.indent ? 'pl-4 font-normal text-ink-2' : 'font-semibold'}`}>
                      {r.label}
                      {style && r.value !== undefined && r.max && (
                        <span aria-hidden="true" className="mt-1.5 block h-1 w-full max-w-[9rem] overflow-hidden rounded-full bg-ink/[0.07]">
                          <span
                            className={`block h-full rounded-full ${style.bar}`}
                            style={{ width: `${Math.max(4, Math.min(100, (r.value / r.max) * 100))}%` }}
                          />
                        </span>
                      )}
                    </th>
                    <td className="tnum py-2.5 text-right align-top font-mono">
                      {r.value !== undefined ? `${fmt(r.value, r.digits ?? 1)}g` : '–'}
                    </td>
                    <td className="w-20 py-2.5 pl-3 text-right align-top">
                      {style && r.value !== undefined ? (
                        <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
                      ) : (
                        <span className="sr-only">No level</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}

/* ---------- Processing, additives, allergens ------------------------- */

function Processing({ food }: { food: Food }) {
  const hasAnything =
    food.nova !== null || food.additives.length > 0 || food.allergens.length > 0 || food.traces.length > 0 || food.eco
  if (!hasAnything) return null

  return (
    <section aria-label="Processing and allergens" className="card divide-y divide-line">
      {food.nova !== null && (
        <div className="p-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-eyebrow">Processing</h2>
            <span className="font-mono text-xs text-ink-3">NOVA {food.nova} of 4</span>
          </div>
          <p className="mt-2 font-semibold">{NOVA_INFO[food.nova].label}</p>
          <p className="mt-0.5 text-sm text-ink-2">{NOVA_INFO[food.nova].detail}</p>
          <div className="mt-3 flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((g) => (
              <span
                key={g}
                className={`h-1.5 flex-1 rounded-full ${
                  g <= food.nova! ? (food.nova === 4 ? 'bg-level-high' : food.nova === 3 ? 'bg-level-moderate' : 'bg-level-low') : 'bg-ink/[0.08]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {food.additives.length > 0 && (
        <div className="p-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-eyebrow">Additives</h2>
            <span className="font-mono text-xs text-ink-3">{food.additives.length}</span>
          </div>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {food.additives.map((a) => (
              <li key={a.code} className="chip">
                <span className="font-mono text-[11px] text-ink-3">{a.code}</span>
                {a.name && <span className="text-ink">{a.name}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(food.allergens.length > 0 || food.traces.length > 0) && (
        <div className="p-5 sm:px-6">
          <h2 className="t-eyebrow">Allergens</h2>
          {food.allergens.length > 0 && (
            <p className="mt-2 text-sm">
              <span className="font-semibold">Contains </span>
              {food.allergens.map(allergenLabel).join(', ')}
            </p>
          )}
          {food.traces.length > 0 && (
            <p className="mt-1 text-sm text-ink-2">
              <span className="font-medium text-ink">May contain </span>
              {food.traces.map(allergenLabel).join(', ')}
            </p>
          )}
        </div>
      )}

      {food.eco && (
        <div className="flex items-center justify-between gap-4 p-5 sm:px-6">
          <div>
            <h2 className="t-eyebrow">Eco-Score</h2>
            <p className="mt-1.5 text-sm text-ink-2">
              Environmental impact{food.ecoEstimated ? ', estimated by AI' : ''}
            </p>
          </div>
          <GradeScale grade={food.eco} label="Eco-Score" />
        </div>
      )}
    </section>
  )
}

/* ---------- Ingredients ---------------------------------------------- */

function Ingredients({ food }: { food: Food }) {
  const [all, setAll] = useState(false)
  if (food.ingredients.length === 0) {
    return (
      <section className="card p-5 sm:px-6">
        <h2 className="t-eyebrow">Ingredients</h2>
        <p className="mt-2 text-sm text-ink-2">No ingredient list has been published for this product.</p>
      </section>
    )
  }
  const LIMIT = 14
  const shown = all ? food.ingredients : food.ingredients.slice(0, LIMIT)

  return (
    <section aria-labelledby="ingredients-h" className="card p-5 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="ingredients-h" className="t-eyebrow">
          Ingredients
        </h2>
        <span className="font-mono text-xs text-ink-3">{food.ingredients.length}</span>
      </div>
      <ol className="mt-3 text-sm leading-7">
        {shown.map((ing, i) => (
          <li key={`${ing}-${i}`} className="inline">
            <span className={i < 3 ? 'font-semibold text-ink' : 'text-ink-2'}>{ing}</span>
            {i < shown.length - 1 && <span className="text-ink-3" aria-hidden="true">, </span>}
          </li>
        ))}
      </ol>
      {food.ingredients.length > LIMIT && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 text-sm font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
        >
          {all ? 'Show fewer' : `Show all ${food.ingredients.length}`}
        </button>
      )}
    </section>
  )
}

function Footnote({ food }: { food: Food }) {
  return (
    <p className="px-1 text-xs leading-relaxed text-ink-3">
      {food.manual
        ? 'You entered these details by hand.'
        : 'Product data from Open Food Facts and Go-UPC, maintained by volunteers and manufacturers.'}{' '}
      Always check the pack if you have an allergy. Not medical advice.
    </p>
  )
}

/* ---------- AI ------------------------------------------------------- */

const AI_ACTIONS: { kind: InsightKind; icon: LucideIcon; blurb: string }[] = [
  { kind: 'alternatives', icon: ArrowRightLeft, blurb: 'Healthier picks that taste alike' },
  { kind: 'diet_compatibility', icon: ListChecks, blurb: 'Any diet, explained' },
  { kind: 'recipe_suggestions', icon: ChefHat, blurb: 'Three ways to use it' },
  { kind: 'eco_impact', icon: Leaf, blurb: 'Carbon, water, packaging' },
]

const RUNNING_LABEL: Record<InsightKind, string> = {
  alternatives: 'Finding better swaps',
  diet_compatibility: 'Checking diets',
  recipe_suggestions: 'Writing recipes',
  eco_impact: 'Estimating the footprint',
}

function AskAI({ food }: { food: Food }) {
  const { profile } = useAuth()
  const { saved, running, open, setOpen, run } = useInsights(food)
  const [dietPicker, setDietPicker] = useState(false)
  const [diets, setDiets] = useState<string[]>([])
  const [usingDiets, setUsingDiets] = useState<string[]>([])
  const thinkingRef = useRef<HTMLDivElement>(null)
  const profileDiets = profile.diets.map(dietLabel)

  const ask = (kind: InsightKind, opts: { diets: string[]; fresh?: boolean }) => {
    setUsingDiets(opts.diets)
    run(kind, opts)
  }

  // Keep the working panel in view; on phones it lands under the fold.
  useEffect(() => {
    if (running) thinkingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [running])

  // Exactly what goes to Gemini with the question, shown while it works.
  const context = [
    food.grade ? `Nutri-Score ${food.grade.toUpperCase()}` : null,
    food.ingredients.length ? `${food.ingredients.length} ingredients` : null,
    food.additives.length ? `${food.additives.length} additive${food.additives.length > 1 ? 's' : ''}` : null,
    'Nutrition per 100g',
    ...usingDiets,
  ].filter(Boolean) as string[]

  const start = (kind: InsightKind) => {
    if (kind === 'diet_compatibility') {
      const cached = saved.diet_compatibility?.diets
      setDiets(cached?.length ? cached : profileDiets.length ? profileDiets : [])
      setDietPicker(true)
      return
    }
    ask(kind, { diets: profileDiets })
  }

  return (
    <section aria-labelledby="ai-h" className="card p-5">
      <h2 id="ai-h" className="font-semibold">
        Go further
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {AI_ACTIONS.map(({ kind, icon: Icon, blurb }) => {
          const busy = running === kind
          const has = Boolean(saved[kind])
          return (
            <button
              key={kind}
              type="button"
              onClick={() => start(kind)}
              disabled={Boolean(running)}
              aria-busy={busy || undefined}
              className="group relative flex min-h-[5.5rem] flex-col items-start justify-between gap-2 tile p-3.5 text-left disabled:opacity-60"
            >
              <span className="flex w-full items-center justify-between">
                {busy ? <PixelGrid className="m-0.5 text-ink" /> : <Icon className="h-4 w-4 text-ink-2 group-hover:text-ink" aria-hidden="true" />}
                {has && !busy && (
                  <span className="rounded-full bg-ink/[0.06] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-3">
                    Saved
                  </span>
                )}
              </span>
              <span>
                <span className="block text-sm font-medium leading-tight">{INSIGHT_TITLES[kind]}</span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-3">{blurb}</span>
              </span>
            </button>
          )
        })}
      </div>

      {running && (
        <div ref={thinkingRef} className="well mt-4 px-4 py-3.5">
          <Thinking label={RUNNING_LABEL[running]} />
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-xs text-ink-3">Using</span>
            {context.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Diet picker */}
      <Modal
        isOpen={dietPicker}
        onClose={() => setDietPicker(false)}
        title="Check against diets"
        description="Pick the diets to check. Yours are selected already."
        footer={
          <Button
            className="w-full"
            disabled={diets.length === 0}
            onClick={() => {
              setDietPicker(false)
              ask('diet_compatibility', { diets })
            }}
          >
            Check {diets.length > 0 ? `${diets.length} diet${diets.length > 1 ? 's' : ''}` : 'diets'}
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Diets">
          {[...DIETS.map((d) => d.label), 'Paleo', 'Low FODMAP', 'Jain'].map((label) => {
            const on = diets.includes(label)
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => setDiets((d) => (on ? d.filter((x) => x !== label) : [...d, label]))}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm transition-colors ${
                  on ? 'border-transparent bg-paper text-accent-ink shadow-neu-inset' : 'border-transparent bg-paper shadow-neu-sm hover:-translate-y-px hover:shadow-neu-hover'
                }`}
              >
                {label}
                {on && <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Answer */}
      <Modal
        isOpen={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? INSIGHT_TITLES[open.kind] : ''}
        description={
          open
            ? `${food.name}${open.kind === 'diet_compatibility' && open.diets?.length ? ` · ${open.diets.join(', ')}` : ''}`
            : undefined
        }
        size="lg"
        footer={
          open && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-ink-3">
                {new Date(open.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <Button
                variant="secondary"
                size="sm"
                loading={running === open.kind}
                icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => ask(open.kind, { diets: open.diets ?? profileDiets, fresh: true })}
              >
                Ask again
              </Button>
            </div>
          )
        }
      >
        {open && <InsightResults content={open.content} />}
      </Modal>
    </section>
  )
}
