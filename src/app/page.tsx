import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/home/Hero'
import Footer from '@/components/layout/Footer'
import { AskIcon, GradeIcon, MatchIcon, ProcessIcon, SwapIcon } from '@/components/home/FeatureIcons'

const FEATURES: { icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; body: string }[] = [
  {
    icon: GradeIcon,
    title: 'A score out of 100',
    body: 'Built on the Nutri-Score, with sugar, fat and salt marked low, medium or high.',
  },
  {
    icon: ProcessIcon,
    title: 'How processed it is',
    body: 'Its NOVA level from 1 to 4, and the plain name behind every E\u00a0number.',
  },
  {
    icon: MatchIcon,
    title: 'Checked against you',
    body: 'Save your diet and allergies once. Every scan flags what does not fit.',
  },
  {
    icon: SwapIcon,
    title: 'Better swaps',
    body: 'Healthier alternatives that taste alike, and recipes to use what you have.',
  },
  {
    icon: AskIcon,
    title: 'Ask NourishAI',
    body: '“Which of my snacks has the least sugar?” NourishAI answers from your scans.',
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

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />

        {/* ============ What a scan shows ============ */}
        <section id="features" aria-labelledby="features-h" className="scroll-mt-20 px-[var(--gutter)] pb-20 pt-10 lg:pb-28 lg:pt-14">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 id="features-h" className="t-title max-w-[12ch] [text-wrap:balance]">
                What one scan tells you
              </h2>
              <p className="mt-4 max-w-xs leading-relaxed text-ink-2">
                Use your camera, upload a photo, or type the number under the barcode.
              </p>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {FEATURES.map((f) => (
                <li key={f.title} className="grid grid-cols-[2.25rem_1fr] gap-x-5 py-7 sm:grid-cols-[2.5rem_1fr] sm:gap-x-7">
                  <f.icon className="h-9 w-9 text-accent-ink sm:h-10 sm:w-10" />
                  <div>
                    <h3 className="font-display text-xl font-bold tracking-tight">{f.title}</h3>
                    <p className="mt-1.5 max-w-md leading-relaxed text-ink-2">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ Why ============ */}
        <section aria-labelledby="why-h" className="bg-surface-2/60 px-[var(--gutter)] py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 id="why-h" className="t-title max-w-2xl">
              The label won’t tell you
            </h2>
            <dl className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
              {STATS.map((s) => (
                <div key={s.claim} className="md:px-8 md:first:pl-0 md:last:pr-0">
                  <dt className="sr-only">{s.claim}</dt>
                  <dd>
                    <span className="tnum block font-display text-[4.5rem] font-extrabold leading-none tracking-[-0.04em] text-accent-ink sm:text-[5.5rem]">
                      {s.figure}
                    </span>
                    <span className="mt-4 block max-w-[18rem] text-lg leading-snug text-ink">{s.claim}</span>
                    <span className="mt-3 block text-sm text-ink-3">{s.source}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ============ Story ============ */}
        <section aria-label="Founder story" className="px-[var(--gutter)] py-20 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <figure className="max-w-3xl">
              <blockquote className="font-display text-[1.6rem] font-bold leading-[1.2] tracking-[-0.02em] sm:text-4xl sm:leading-[1.15]">
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
          </div>
        </section>

        {/* ============ Start ============ */}
        <section aria-labelledby="start-h" className="px-[var(--gutter)] pb-20 lg:pb-28">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-3xl bg-accent px-8 py-10 text-on-accent sm:px-14 sm:py-14 lg:flex-row lg:items-center">
            <h2 id="start-h" className="font-display text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.03em]">
              What’s in your cupboard?
            </h2>
            <Link
              href="/app"
              className="btn h-12 shrink-0 rounded-full bg-on-accent px-7 text-[0.9375rem] text-accent-ink shadow-neu-sm hover:-translate-y-px"
            >
              Start scanning
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
