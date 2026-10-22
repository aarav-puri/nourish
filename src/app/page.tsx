import Link from 'next/link'
import {
  ArrowRight,
  ArrowRightLeft,
  Camera,
  FlaskConical,
  Gauge,
  MessageSquareText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/home/Hero'
import Footer from '@/components/layout/Footer'

const STEPS = [
  {
    n: '01',
    title: 'Scan',
    body: 'Point your camera at any barcode. No camera handy? Upload a photo or type the number.',
  },
  {
    n: '02',
    title: 'Read',
    body: 'An A to E grade, the sugar, fat and salt, how processed it is, and every additive and allergen in plain words.',
  },
  {
    n: '03',
    title: 'Decide',
    body: 'See straight away whether it fits your diet and allergies. Want better? Get a healthier swap that tastes alike.',
  },
]

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Checked against you',
    body: 'Tell Nourish your diet and allergies once. Every scan flags what does not fit before you read a word.',
  },
  {
    icon: Gauge,
    title: 'A grade you already know',
    body: 'The A to E Nutri-Score used on packs across Europe, with fat, sugar and salt marked low, medium or high.',
  },
  {
    icon: FlaskConical,
    title: 'Spot ultra-processed food',
    body: 'See how processed it is, and what every E number on the label means.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Better swaps',
    body: 'Healthier alternatives that taste alike, plus recipe ideas and the environmental footprint.',
  },
  {
    icon: MessageSquareText,
    title: 'Ask your history',
    body: '“Which of my snacks has the least sugar?” Ask in plain words and get answers from everything you have scanned.',
  },
  {
    icon: Camera,
    title: 'Made for the aisle',
    body: 'One hand, one scan, and the next one is a thumb away.',
  },
]

const STATS = [
  {
    figure: '73%',
    claim: 'of the U.S. packaged food supply is ultra-processed',
    source: 'Nature Communications, 2023',
  },
  {
    figure: '12%',
    claim: 'of U.S. adults have proficient health literacy',
    source: 'National Assessment of Adult Literacy',
  },
  {
    figure: '32',
    claim: 'adverse health outcomes linked to ultra-processed food',
    source: 'The BMJ, 2024',
  },
]

/** The small numbered line that opens each section. */
function SectionLabel({ n, name }: { n: string; name: string }) {
  return (
    <p className="mb-5 flex items-baseline gap-2.5 text-sm text-ink">
      <span className="font-mono text-xs text-ink-3">{n}</span>
      <span className="font-medium">{name}</span>
    </p>
  )
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />

        {/* ============ How it works ============ */}
        <section id="how" aria-labelledby="how-h" className="scroll-mt-20 overflow-x-clip px-[var(--gutter)] py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div>
              <SectionLabel n="01" name="How it works" />
              <h2 id="how-h" className="t-title max-w-xl">
                From shelf to answer in one scan.
              </h2>
              <ol className="mt-12 space-y-10">
                {STEPS.map((s) => (
                  <li key={s.n} className="grid gap-x-6 border-t border-line pt-5 sm:grid-cols-[4rem_1fr]">
                    <span className="font-mono text-sm text-accent-ink">{s.n}</span>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight">{s.title}</h3>
                      <p className="mt-2 max-w-md leading-relaxed text-ink-2">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ============ Features ============ */}
        <section id="features" aria-labelledby="features-h" className="scroll-mt-20 px-[var(--gutter)] py-20 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionLabel n="02" name="Features" />
              <h2 id="features-h" className="t-title">
                Everything you would otherwise squint at.
              </h2>
              <p className="mt-4 max-w-sm leading-relaxed text-ink-2">
                The small print on the back of the pack, read for you in seconds.
              </p>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li
                  key={f.title}
                  className="card p-7 transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-neu-hover"
                >
                  <span className="nourish-feature-icon">
                    <f.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{f.title}</h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ Why ============ */}
        <section aria-labelledby="why-h" className="px-[var(--gutter)] py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionLabel n="03" name="Why" />
            <h2 id="why-h" className="t-title max-w-2xl">
              Labels are written for regulators, not for people in a hurry.
            </h2>
            <dl className="mt-14 grid gap-8 md:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.claim} className="card p-8 transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-neu-hover">
                  <dt className="sr-only">{s.claim}</dt>
                  <dd>
                    <span className="block font-display text-6xl font-extrabold leading-none tracking-tight text-accent-ink">{s.figure}</span>
                    <span className="mt-4 block leading-relaxed text-ink-2">{s.claim}</span>
                    <span className="mt-3 block text-xs text-ink-3">{s.source}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ============ Story + promises ============ */}
        <section aria-labelledby="story-h" className="px-[var(--gutter)] py-20 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:gap-20">
            <figure>
              <blockquote className="font-display font-bold text-[1.6rem] leading-[1.2] sm:text-3xl">
                “My dad is vegetarian, and I kept noticing how often packaged food quietly includes things that do not fit.
                I wanted a scan to tell us, instantly.”
              </blockquote>
              <figcaption className="mt-6 text-sm text-ink-2">
                Aarav Puri, founder.{' '}
                <Link href="/about" className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                  Read the story
                </Link>
              </figcaption>
            </figure>
            <div>
              <h2 id="story-h" className="font-display text-2xl font-extrabold tracking-tight">
                Our promises
              </h2>
              <dl className="card mt-6 divide-y divide-line px-6 py-2 sm:px-8">
                {[
                  ['Free to use', 'Scanning, history and your food profile are free. AI features use your own Gemini API key and are subject to Google’s Gemini API pricing.'],
                  ['Your data stays yours', 'We never sell or share your scans or profile. Not with brands, not with advertisers.'],
                  ['No paid placement', 'No ads, no sponsored products, and no brand can buy a better grade.'],
                  ['Delete anytime', 'Remove your account in Settings and everything in it goes too.'],
                ].map(([t, b]) => (
                  <div key={t} className="grid gap-1 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
                    <dt className="font-semibold">{t}</dt>
                    <dd className="text-ink-2">{b}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="px-[var(--gutter)] pb-20 lg:pb-28">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-3xl border border-accent/10 bg-accent-soft/70 p-8 sm:p-14 lg:flex-row lg:items-center">
            <h2 className="t-title">Try it on the next thing you eat.</h2>
            <Link href="/app" className="btn-primary group h-12 shrink-0 px-6 text-[0.9375rem]">
              Scan your first product
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
