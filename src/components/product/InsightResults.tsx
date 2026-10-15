import type { ReactNode } from 'react'
import { AlertTriangle, ArrowUpRight, Check, Clock, Flame, HelpCircle, Info, Lightbulb, X } from 'lucide-react'

/* The renderers for each kind of AI answer. They read loosely typed JSON from
   the model, so every field is optional and every number is checked. */

const box = 'rounded-3xl bg-paper p-5 shadow-neu-sm sm:p-6'

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="t-eyebrow">{children}</p>
}

/** A ten-step meter for 1-10 ratings. */
function Meter({ value, label }: { value: number; label: string }) {
  const filled = Math.max(0, Math.min(10, Math.round(value)))
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={filled} className="flex h-1.5 w-full gap-[3px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={`flex-1 rounded-full ${i < filled ? 'bg-ink' : 'bg-ink/10'}`} />
      ))}
    </div>
  )
}

const LEVEL_PILL: Record<string, string> = {
  Low: 'bg-level-low/10 text-level-low',
  Medium: 'bg-level-moderate/15 text-[rgb(var(--ink))]',
  High: 'bg-level-high/10 text-level-high',
}

/* ---------- Alternatives ------------------------------------------------ */

function Alternatives({ items }: { items: any[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => {
        const name: string = item.product_name || item.food_name || ''
        const similarity = Number(item.flavor_similarity)
        const hasSimilarity = item.flavor_similarity != null && Number.isFinite(similarity)
        return (
          <li key={i} className="overflow-hidden rounded-3xl bg-paper shadow-neu-sm">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wide text-ink-3">
                <span>Swap {String(i + 1).padStart(2, '0')}</span>
                {hasSimilarity && <span className="tnum normal-case tracking-normal">Tastes {similarity}/10 alike</span>}
              </div>
              <h3 className="mt-2 font-display font-bold text-xl leading-snug">{name}</h3>
              {(item.why_healthier || item.why_helps) && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{item.why_healthier || item.why_helps}</p>
              )}
              {(item.sugar_diff || item.additive_diff || item.price_range) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.sugar_diff && <span className="chip">{item.sugar_diff}</span>}
                  {item.additive_diff && <span className="chip">{item.additive_diff}</span>}
                  {item.price_range && <span className="chip font-mono">{item.price_range}</span>}
                </div>
              )}
              {hasSimilarity && (
                <div className="mt-4">
                  <Meter value={similarity} label="Flavour similarity out of 10" />
                </div>
              )}
            </div>
            {name && (
              <a
                href={`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between border-t border-dashed border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2/50 hover:text-ink sm:px-5"
              >
                Look it up on Open Food Facts
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Recipes ----------------------------------------------------- */

function Recipes({ items }: { items: any[] }) {
  return (
    <ol className="space-y-3">
      {items.map((recipe, i) => (
        <li key={i} className={box}>
          <h3 className="font-display font-bold text-xl leading-tight">{recipe.recipe_name}</h3>
          {recipe.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{recipe.description}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {recipe.difficulty && <span className="chip">{recipe.difficulty}</span>}
            {recipe.prep_time != null && (
              <span className="chip">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {String(recipe.prep_time).replace(/\s*min(utes)?/i, '')} min
              </span>
            )}
            {recipe.calories != null && (
              <span className="chip">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                {String(recipe.calories).replace(/\s*k?cal(ories)?/i, '')} kcal
              </span>
            )}
          </div>

          {Array.isArray(recipe.other_ingredients) && recipe.other_ingredients.length > 0 && (
            <div className="mt-4">
              <Eyebrow>You will also need</Eyebrow>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{recipe.other_ingredients.join(' · ')}</p>
            </div>
          )}

          {recipe.health_benefits && (
            <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-ink-2">{recipe.health_benefits}</p>
          )}
        </li>
      ))}
    </ol>
  )
}

/* ---------- Eco impact -------------------------------------------------- */

function Eco({ content }: { content: any }) {
  const overall = Number(content.overall_score)
  const packaging = Number(content.packaging_score)
  const metrics = [
    { key: 'carbon_footprint', label: 'Carbon' },
    { key: 'water_usage', label: 'Water' },
    { key: 'transportation_impact', label: 'Transport' },
  ].filter((m) => content[m.key])

  return (
    <div className="space-y-3">
      {Number.isFinite(overall) && (
        <div className={`${box} flex items-center gap-5`}>
          <div className="text-center">
            <span className="tnum block font-display font-bold text-5xl leading-none">{overall}</span>
            <span className="mt-1 block font-mono text-2xs text-ink-3">OUT OF 10</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {overall >= 7 ? 'Gentle on the planet' : overall >= 4 ? 'Middle of the road' : 'Heavy footprint'}
            </p>
            {content.category_comparison && (
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{content.category_comparison}</p>
            )}
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <dl className="grid grid-cols-3 gap-2">
          {metrics.map((m) => (
            <div key={m.key} className="well p-3 text-center">
              <dt className="text-xs text-ink-3">{m.label}</dt>
              <dd className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEVEL_PILL[content[m.key]] ?? 'bg-ink/5'}`}>
                {content[m.key]}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {Number.isFinite(packaging) && content.packaging_score != null && (
        <div className={box}>
          <div className="mb-2.5 flex items-center justify-between text-sm">
            <span>Packaging</span>
            <span className="tnum font-mono text-xs font-medium">{packaging}/10</span>
          </div>
          <Meter value={packaging} label="Packaging score out of 10" />
        </div>
      )}

      {content.explanation && (
        <div className={box}>
          <Eyebrow>Why</Eyebrow>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{content.explanation}</p>
        </div>
      )}

      {Array.isArray(content.tips) && content.tips.length > 0 && (
        <div className={box}>
          <Eyebrow>What you can do</Eyebrow>
          <ul className="mt-2 space-y-2">
            {content.tips.map((tip: string, i: number) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
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

const VERDICT: Record<string, { label: string; icon: typeof Check; tone: string }> = {
  Yes: { label: 'Compatible', icon: Check, tone: 'bg-level-low text-white' },
  Maybe: { label: 'Check the label', icon: HelpCircle, tone: 'bg-level-moderate text-[#2b2200]' },
  No: { label: 'Not compatible', icon: X, tone: 'bg-level-high text-white' },
}

function Diets({ content }: { content: Record<string, any> }) {
  const entries = Object.entries(content).filter(([, info]) => info && typeof info === 'object')

  return (
    <div className="space-y-2.5">
      {entries.map(([diet, info]) => {
        const v = VERDICT[info.compatible] ?? VERDICT.Maybe
        const confidence = Number(info.confidence)
        const concerns = info.concerns && info.concerns !== 'null' ? info.concerns : null
        const alt = info.alternatives && info.alternatives !== 'null' ? info.alternatives : null
        return (
          <div key={diet} className={box}>
            <div className="flex items-center gap-3">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${v.tone}`}>
                <v.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="flex-1 font-semibold">{diet}</h3>
              <span className="text-sm text-ink-2">{v.label}</span>
            </div>
            {info.reason && <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{info.reason}</p>}
            {concerns && (
              <p className="mt-2 flex gap-2 text-sm leading-relaxed">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-level-high" aria-hidden="true" />
                {typeof concerns === 'string' ? concerns : JSON.stringify(concerns)}
              </p>
            )}
            {alt && (
              <p className="mt-2 flex gap-2 text-sm leading-relaxed text-ink-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                {alt}
              </p>
            )}
            {Number.isFinite(confidence) && info.confidence != null && (
              <p className="mt-3 font-mono text-2xs uppercase tracking-wide text-ink-3">Confidence {confidence}/10</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Entry point -------------------------------------------------- */

export default function InsightResults({ content }: { content: any }) {
  if (!content) return null

  let body: ReactNode
  if (Array.isArray(content)) {
    body = content[0]?.recipe_name ? <Recipes items={content} /> : <Alternatives items={content} />
  } else if (content.overall_score !== undefined) {
    body = <Eco content={content} />
  } else {
    body = <Diets content={content} />
  }

  return (
    <div>
      {body}
      <p className="mt-4 flex gap-2 text-xs leading-relaxed text-ink-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Generated by AI from the product data. Check the pack if you have an allergy or a strict requirement.
      </p>
    </div>
  )
}
