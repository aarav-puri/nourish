/**
 * A bespoke diagram per capability. These are illustrations of the readout,
 * not live data, so they are hidden from assistive technology - the row copy
 * beside them carries the meaning.
 */
export type VisualKey = 'ai' | 'swap' | 'eco' | 'scan' | 'diet' | 'recipe' | 'assistant'

// No hue in the system, so a row's emphasis comes from weight and value.
const Row = ({ label, value, tone = 'muted' }: { label: string; value: string; tone?: 'muted' | 'signal' | 'alarm' }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2.5 font-mono text-[11px] uppercase tracking-label last:border-b-0">
    <span className="opacity-60">{label}</span>
    <span className={tone === 'muted' ? 'opacity-80' : 'font-bold'}>{value}</span>
  </div>
)

export default function FeatureVisual({ k }: { k: VisualKey }) {
  const common = 'w-full'

  switch (k) {
    // A score resolving out of the ingredient text.
    case 'ai':
      return (
        <div className={common} aria-hidden="true">
          <div className="mb-6 space-y-1.5">
            {[100, 82, 91, 64].map((w, i) => (
              <span key={i} className="block h-[3px] bg-current opacity-25" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex items-end gap-4">
            <span className="tnum font-mono text-6xl font-bold leading-none">38</span>
            <span className="t-label pb-2 opacity-60">/ 100 health score</span>
          </div>
          <div className="mt-5 flex h-2 w-full gap-[3px]">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className={`flex-1 ${i < 15 ? 'bg-current' : 'bg-current opacity-15'}`} />
            ))}
          </div>

          {/* The findings behind the number: this is the widest card in the
              bento, so the diagram carries the reasoning too. */}
          <div className="mt-8">
            <Row label="Ultra processed" value="Yes" tone="signal" />
            <Row label="Additives" value="2 of concern" tone="signal" />
            <Row label="Added sugar" value="34g / 100g" tone="signal" />
            <Row label="Saturated fat" value="High" tone="signal" />
            <Row label="Protein" value="6.1g" />
            <Row label="Verdict" value="Occasional" tone="signal" />
          </div>
        </div>
      )

    // This one, versus the one you should buy instead.
    case 'swap':
      return (
        <div className={common} aria-hidden="true">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="rounded-xl border border-white/15 p-4">
              <span className="t-label opacity-60">Scanned</span>
              <span className="tnum mt-2 block font-mono text-3xl font-bold opacity-55">38</span>
            </div>
            <span className="font-mono text-xl opacity-40">→</span>
            <div className="rounded-xl border border-white bg-white p-4 text-black">
              <span className="t-label">Swap</span>
              <span className="tnum mt-2 block font-mono text-3xl font-bold">81</span>
            </div>
          </div>
          <div className="mt-5">
            <Row label="Sugar" value="−26g" tone="signal" />
            <Row label="Additives" value="−2" tone="signal" />
            <Row label="Price" value="+$0.20" />
          </div>
        </div>
      )

    // Footprint, as a measured bar.
    case 'eco':
      return (
        <div className={common} aria-hidden="true">
          {[
            { l: 'This product', v: 78, t: '2.1 kg' },
            { l: 'Category median', v: 46, t: '1.2 kg' },
            { l: 'Best in category', v: 19, t: '0.5 kg' },
          ].map((b, i) => (
            <div key={b.l} className="mb-5 last:mb-0">
              <div className="mb-2 flex justify-between font-mono text-[11px] uppercase tracking-label">
                <span className="opacity-60">{b.l}</span>
                <span className={i === 1 ? 'opacity-70' : 'font-bold'}>{b.t}</span>
              </div>
              <div className="h-3 w-full bg-white/10">
                <span
                  className={`block h-full bg-current ${i === 0 ? '' : i === 1 ? 'opacity-35' : 'opacity-70'}`}
                  style={{ width: `${b.v}%` }}
                />
              </div>
            </div>
          ))}
          <p className="t-label mt-6 opacity-50">kg CO₂e per 100g</p>
        </div>
      )

    // The strip, mid-read.
    case 'scan':
      return (
        <div className={common} aria-hidden="true">
          <div className="relative flex h-28 items-end gap-[3px] overflow-hidden border-b border-white/15 pb-1">
            {Array.from({ length: 46 }).map((_, i) => (
              <span
                key={i}
                className={`flex-1 ${i < 22 ? 'bg-current' : 'bg-current opacity-25'}`}
                style={{ height: `${40 + ((i * 37) % 60)}%` }}
              />
            ))}
            <span className="absolute inset-y-0 left-1/2 w-[2px] bg-current" />
          </div>
          <div className="mt-5">
            <Row label="Format" value="EAN 13" tone="signal" />
            <Row label="Read in" value="0.4s" />
            <Row label="Sources" value="Camera, photo, paste, type" />
          </div>
        </div>
      )

    // Six rules, checked in one pass.
    case 'diet':
      return (
        <div className={common} aria-hidden="true">
          {[
            ['Vegetarian', true],
            ['Vegan', false],
            ['Gluten free', false],
            ['Nut free', true],
            ['Keto', false],
            ['Halal', true],
          ].map(([label, pass]) => (
            <div
              key={label as string}
              className="flex items-center justify-between border-b border-white/10 py-2.5 font-mono text-[11px] uppercase tracking-label last:border-b-0"
            >
              <span className="opacity-70">{label as string}</span>
              <span className={pass ? 'font-bold' : 'opacity-55'}>
                {pass ? '✓ Pass' : '✕ Fail'}
              </span>
            </div>
          ))}
        </div>
      )

    // What you can make with it.
    case 'recipe':
      return (
        <div className={common} aria-hidden="true">
          <div className="flex flex-wrap gap-2">
            {['Oats', 'Peanut butter', 'Banana'].map((c) => (
              <span key={c} className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-label">
                {c}
              </span>
            ))}
          </div>
          <div className="my-5 font-mono text-xl opacity-40">↓</div>
          <div className="rounded-xl border border-white bg-white p-5 text-black">
            <span className="t-label">Suggested</span>
            <p className="t-h3 mt-2">Overnight breakfast bars</p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-label opacity-60">
              12 min · 4 ingredients
            </p>
          </div>
        </div>
      )

    // It has read everything you scanned.
    case 'assistant':
      return (
        <div className={common} aria-hidden="true">
          {/* A bare <p> is a block, so ml-auto plus max-w made the bubble a
              fixed slab at 85% of the column with the text ragged inside it.
              w-fit makes each bubble hug its own text, with max-w only as a
              ceiling before it wraps. */}
          <div className="flex flex-col gap-3">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl border border-white/15 px-3.5 py-2.5 text-[13px] leading-snug">
              Which of my scans has the least sugar?
            </p>
            <p className="w-fit max-w-[90%] rounded-2xl border border-white bg-white px-3.5 py-2.5 text-[13px] leading-snug text-black">
              Of your 14 scans, the oat crackers at 1.2g per 100g. The next lowest is four times that.
            </p>
          </div>
          <div className="mt-5">
            <Row label="Context" value="Your scan history" tone="signal" />
          </div>
        </div>
      )
  }
}
