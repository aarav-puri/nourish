import type { ComponentType, ReactNode } from 'react'
import {
  ArrowRightLeft,
  Candy,
  Check,
  ChefHat,
  CircleAlert,
  Cloud,
  Droplets,
  FlaskConical,
  Flame,
  HeartPulse,
  Leaf,
  Lightbulb,
  Minus,
  Package,
  Tag,
  Timer,
  Truck,
  TriangleAlert,
  X,
} from 'lucide-react'

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>

/* State is carried by fill weight and a text label, never by hue: hairline is
   the good case, dim hairline the middle, solid white the one to look at. */
const WEIGHT = {
  good: 'border-white/30 bg-transparent text-white',
  medium: 'border-white/15 bg-transparent text-zinc-300',
  poor: 'border-white bg-white font-bold text-black',
}

/* ---------- Shared pieces ---------------------------------------------- */

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-label text-zinc-500">{children}</p>
}

function Rank({ n }: { n: number }) {
  return (
    <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 font-display text-sm font-bold">
      {n}
    </span>
  )
}

function Chip({ icon: I, children }: { icon?: Icon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
      {I && <I className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />}
      {children}
    </span>
  )
}

/** A segmented meter, the same one the score readout uses. */
function Segments({ value, max = 10, label }: { value: number; max?: number; label: string }) {
  const filled = Math.max(0, Math.min(max, Math.round(value)))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={filled}
      className="flex h-2 w-full gap-[3px]"
    >
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`flex-1 ${i < filled ? 'bg-white' : 'bg-white/15'}`} />
      ))}
    </div>
  )
}

function Callout({ icon: I, children }: { icon: Icon; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300">
      <I className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

const card = 'rounded-2xl border border-white/10 bg-white/[0.03] p-5'

/* ---------- Alternatives ------------------------------------------------ */

function Alternatives({ items }: { items: any[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => {
        const similarity = Number(item.flavor_similarity)
        return (
          <li key={i} className={card}>
            <div className="flex items-start gap-4">
              <Rank n={i + 1} />
              <div className="min-w-0 flex-1">
                <h4 className="font-display text-base font-semibold leading-snug">
                  {item.product_name || item.food_name}
                </h4>
                {(item.why_healthier || item.why_helps) && (
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                    {item.why_healthier || item.why_helps}
                  </p>
                )}

                {Number.isFinite(similarity) && item.flavor_similarity != null && (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between font-mono text-[11px] uppercase tracking-label">
                      <span className="text-zinc-500">Tastes similar</span>
                      <span className="tnum font-bold text-white">{similarity} / 10</span>
                    </div>
                    <Segments value={similarity} label="Flavor similarity" />
                  </div>
                )}

                {(item.sugar_diff || item.additive_diff || item.price_range) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.sugar_diff && <Chip icon={Candy}>{item.sugar_diff}</Chip>}
                    {item.additive_diff && <Chip icon={FlaskConical}>{item.additive_diff}</Chip>}
                    {item.price_range && <Chip icon={Tag}>{item.price_range}</Chip>}
                  </div>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Recipes ----------------------------------------------------- */

const DIFFICULTY: Record<string, string> = {
  Easy: WEIGHT.good,
  Medium: WEIGHT.medium,
  Hard: WEIGHT.poor,
}

function Recipes({ items }: { items: any[] }) {
  return (
    <ol className="space-y-3">
      {items.map((recipe, i) => (
        <li key={i} className={card}>
          <div className="flex items-start gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
              <ChefHat className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="font-display text-base font-semibold leading-snug">{recipe.recipe_name}</h4>
              {recipe.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{recipe.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {recipe.difficulty && (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      DIFFICULTY[recipe.difficulty] ?? WEIGHT.medium
                    }`}
                  >
                    {recipe.difficulty}
                  </span>
                )}
                {recipe.prep_time != null && <Chip icon={Timer}>{recipe.prep_time} min</Chip>}
                {recipe.calories != null && <Chip icon={Flame}>{recipe.calories} cal</Chip>}
              </div>

              {Array.isArray(recipe.other_ingredients) && recipe.other_ingredients.length > 0 && (
                <div className="mt-5">
                  <Eyebrow>You will also need</Eyebrow>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {recipe.other_ingredients.map((ing: string, idx: number) => (
                      <li
                        key={idx}
                        className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-zinc-300"
                      >
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recipe.health_benefits && (
                <div className="mt-5">
                  <Callout icon={HeartPulse}>
                    {recipe.health_benefits}
                  </Callout>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ---------- Eco impact -------------------------------------------------- */

const LEVEL: Record<string, { text: string; badge: string }> = {
  Low: { text: 'Low impact', badge: WEIGHT.good },
  Medium: { text: 'Medium impact', badge: WEIGHT.medium },
  High: { text: 'High impact', badge: WEIGHT.poor },
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(10, score))
  const r = 52
  const circumference = 2 * Math.PI * r
  const verdict = clamped >= 7 ? 'Gentle on the planet' : clamped >= 4 ? 'Middle of the road' : 'Heavy footprint'

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" className="stroke-white/10" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 10)}
            className="stroke-white"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tnum font-display text-4xl font-bold leading-none">{score}</span>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-label text-zinc-500">out of 10</span>
        </div>
      </div>
      <p className="mt-3 font-display text-base font-semibold">{verdict}</p>
      <p className="mt-0.5 text-xs text-zinc-500">Higher is better for the environment</p>
    </div>
  )
}

function Eco({ content }: { content: any }) {
  const metrics: { key: string; label: string; icon: Icon }[] = [
    { key: 'carbon_footprint', label: 'Carbon', icon: Cloud },
    { key: 'water_usage', label: 'Water', icon: Droplets },
    { key: 'transportation_impact', label: 'Transport', icon: Truck },
  ]
  const packaging = Number(content.packaging_score)

  return (
    <div className="space-y-5">
      <ScoreRing score={Number(content.overall_score) || 0} />

      <div className="grid grid-cols-3 gap-2.5">
        {metrics.map(({ key, label, icon: I }) =>
          content[key] ? (
            <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-center">
              <I className="mx-auto h-5 w-5 text-zinc-400" aria-hidden="true" />
              <p className="mt-2 text-[11px] font-bold uppercase tracking-label text-zinc-500">{label}</p>
              <span
                className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  LEVEL[content[key]]?.badge ?? WEIGHT.medium
                }`}
              >
                {LEVEL[content[key]]?.text ?? content[key]}
              </span>
            </div>
          ) : null
        )}
      </div>

      {content.packaging_score != null && Number.isFinite(packaging) && (
        <div className={card}>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-zinc-300">
              <Package className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              Packaging
            </span>
            <span className="tnum font-mono text-[11px] font-bold uppercase tracking-label">
              {packaging} / 10
            </span>
          </div>
          <Segments value={packaging} label="Packaging score" />
        </div>
      )}

      {content.category_comparison && (
        <Callout icon={ArrowRightLeft}>
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-label text-zinc-500">
            Versus similar products
          </span>
          {content.category_comparison}
        </Callout>
      )}

      {content.explanation && (
        <div className={card}>
          <Eyebrow>The reasoning</Eyebrow>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{content.explanation}</p>
        </div>
      )}

      {Array.isArray(content.tips) && content.tips.length > 0 && (
        <div className={card}>
          <Eyebrow>What you can do</Eyebrow>
          <ul className="mt-3 space-y-3">
            {content.tips.map((tip: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                  <Leaf className="h-3.5 w-3.5 text-zinc-300" aria-hidden="true" />
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ---------- Diet compatibility ------------------------------------------ */

const VERDICT: Record<
  string,
  { label: string; icon: Icon; row: string; badge: string; dot: string }
> = {
  Yes: {
    label: 'Compatible',
    icon: Check,
    row: 'border-white/25 bg-white/[0.05]',
    badge: WEIGHT.good,
    dot: 'bg-white text-black',
  },
  Maybe: {
    label: 'Check the label',
    icon: Minus,
    row: 'border-white/10 bg-white/[0.02]',
    badge: WEIGHT.medium,
    dot: 'border border-white/30 text-zinc-300',
  },
  No: {
    label: 'Not compatible',
    icon: X,
    row: 'border-white/10 bg-black',
    badge: WEIGHT.poor,
    dot: 'border border-white bg-black text-white',
  },
}

function Diets({ content }: { content: Record<string, any> }) {
  const entries = Object.entries(content).filter(([, info]) => info && typeof info === 'object')
  const yes = entries.filter(([, info]) => info.compatible === 'Yes').length

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4 pb-1">
        <Eyebrow>Your diets</Eyebrow>
        <p className="tnum font-mono text-[11px] uppercase tracking-label text-zinc-400">
          <span className="font-bold text-white">{yes}</span> of {entries.length} compatible
        </p>
      </div>

      {entries.map(([diet, info]) => {
        const v = VERDICT[info.compatible] ?? VERDICT.Maybe
        const V = v.icon
        const confidence = Number(info.confidence)
        const hasConcerns = info.concerns && info.concerns !== 'null'
        const hasAlt = info.alternatives && info.alternatives !== 'null'

        return (
          <div key={diet} className={`rounded-2xl border p-5 ${v.row}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${v.dot}`}>
                  <V className="h-4 w-4" aria-hidden="true" />
                </span>
                <h4 className="font-display text-base font-semibold">{diet}</h4>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${v.badge}`}>
                {v.label}
              </span>
            </div>

            {info.reason && <p className="mt-3 text-sm leading-relaxed text-zinc-300">{info.reason}</p>}

            {hasConcerns && (
              <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-white">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {info.concerns}
              </p>
            )}
            {hasAlt && (
              <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                {info.alternatives}
              </p>
            )}

            {info.confidence != null && Number.isFinite(confidence) && (
              <div className="mt-4 flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-label text-zinc-500">Confidence</span>
                <div className="flex-1">
                  <Segments value={confidence} label={`${diet} confidence`} />
                </div>
                <span className="tnum font-mono text-[11px] font-bold">{confidence}/10</span>
              </div>
            )}
          </div>
        )
      })}

      <Callout icon={CircleAlert}>
        AI reads the ingredient list only. If you have an allergy or a strict requirement, check the
        package too.
      </Callout>
    </div>
  )
}

/* ---------- Entry point -------------------------------------------------- */

export default function InsightResults({ content }: { content: any }) {
  if (!content) return null

  if (Array.isArray(content)) {
    return content[0]?.recipe_name ? <Recipes items={content} /> : <Alternatives items={content} />
  }
  if (content.overall_score !== undefined) return <Eco content={content} />
  return <Diets content={content} />
}
