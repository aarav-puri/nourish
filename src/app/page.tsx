'use client'

import Link from 'next/link'
import { ArrowRight, Check, Minus, X } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SiteBackground from '@/components/brand/SiteBackground'
import ScoreTicker from '@/components/brand/ScoreTicker'
import Reveal from '@/components/brand/Reveal'
import CountUp from '@/components/brand/CountUp'
import Magnetic from '@/components/brand/Magnetic'
import ScanSteps from '@/components/home/ScanSteps'
import FeatureBento from '@/components/home/FeatureBento'
import { useAuth } from '@/lib/auth-context'

const FORMATS = ['EAN 13', 'EAN 8', 'UPC A', 'UPC E', 'Code 128', 'Code 39', 'QR']

const STATS = [
  {
    to: 73,
    suffix: '%',
    claim: 'of the U.S. packaged food supply is ultra processed',
    source: 'Nature Communications, 2023. Northeastern University',
  },
  {
    to: 12,
    suffix: '%',
    claim: 'of U.S. adults have proficient health literacy',
    source: 'National Assessment of Adult Literacy, U.S. Dept. of Education',
  },
  {
    to: 32,
    suffix: '',
    claim: 'adverse health outcomes linked to ultra processed foods',
    source: 'The BMJ, 2024',
  },
]

const COMPARISON = [
  { feature: 'AI powered analysis', us: 'full', manual: 'none', basic: 'none' },
  { feature: 'Healthier alternatives', us: 'full', manual: 'none', basic: 'none' },
  { feature: 'Recipe ideas', us: 'full', manual: 'none', basic: 'none' },
  { feature: 'Eco impact score', us: 'full', manual: 'none', basic: 'none' },
  { feature: 'Diet compatibility check', us: 'full', manual: 'part', basic: 'part' },
  { feature: 'Instant results', us: 'full', manual: 'none', basic: 'full' },
] as const

const MARK = {
  full: { Icon: Check, text: 'Yes', cls: 'text-white' },
  part: { Icon: Minus, text: 'Partial', cls: 'text-zinc-400' },
  none: { Icon: X, text: 'No', cls: 'text-zinc-600' },
}

const PRIVACY = [
  { t: 'Encrypted at rest', b: 'We encrypt your scans in storage, using standard industry protection.' },
  { t: 'Never sold', b: "We don't sell your details or your scan history. Not to brands, not to anyone." },
  { t: 'Yours alone', b: 'No other user can see what you scanned or what we told you about it.' },
  { t: 'Gone when you say', b: 'Ask us to delete your account and everything in it goes with it.' },
]

const FAQ = [
  {
    q: 'How does BarcodeSense work?',
    a: "Scan a barcode with your camera, upload a photo of one, or type the number in. We look the product up in global food databases, then explain its ingredients, nutrition and environmental impact in plain English and tell you what we'd do about it.",
  },
  {
    q: 'What are AI insights?',
    a: "The parts that go beyond the raw product data: healthier alternatives, diet checks like vegan, keto and gluten free, environmental impact, and recipe ideas based on what you've scanned.",
  },
  {
    q: 'How accurate is the product information?',
    a: "The data comes from global databases covering millions of products, but it isn't always complete or up to date. Treat it as a guide and check the label on the package too, especially for allergies.",
  },
  {
    q: 'What if my product is not in the database?',
    a: "Some local or newly released products haven't been added yet. You can type in the ingredients and nutrition yourself and the AI will analyze those instead. The databases keep growing.",
  },
]

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const primaryLabel = user ? 'Open scanner' : 'Start scanning'

  // Three pulsing dots while the session resolves, so the button never shows
  // the wrong label and never sits blank.
  const cta = authLoading ? (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-75" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current delay-150" />
      <span className="sr-only">Checking your session</span>
    </span>
  ) : (
    <>
      {primaryLabel}
      <ArrowRight
        className="h-4 w-4 transition-transform duration-[120ms] group-hover:translate-x-1"
        aria-hidden="true"
      />
    </>
  )

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-black text-white">
      <SiteBackground />
      <Navbar />

      <main id="main" className="relative z-10">
        {/* ===================== HERO ===================== */}
        <section className="px-[var(--gutter)] pb-16 pt-36 sm:pt-44">
          <div className="mx-auto max-w-5xl text-center">
            <h1
              className="t-display animate-fade-up text-balance"
              style={{ animationDelay: '0.15s' }}
            >
              <span className="text-fade block">Your second opinion</span>
              <span className="text-fade block">
                in the{' '}
                <span className="relative inline-block text-white">
                  grocery aisle.
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full text-white opacity-70"
                  >
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
              </span>
            </h1>

            <p
              className="animate-fade-up mx-auto mt-10 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl"
              style={{ animationDelay: '0.25s' }}
            >
              Shop smarter. Get clear ingredient breakdowns, an instant health score, and better
              shelf swaps from one barcode.
            </p>

            <div
              className="animate-fade-up mt-12 flex flex-col items-center justify-center gap-5 md:flex-row"
              style={{ animationDelay: '0.35s' }}
            >
              <Magnetic strength={8}>
                <Link
                  href="/app"
                  className="shiny-cta group inline-flex min-h-14 items-center justify-center rounded-full px-9"
                  aria-busy={authLoading || undefined}
                >
                  <span className="relative z-10 flex items-center gap-2 font-semibold text-white">
                    {cta}
                  </span>
                </Link>
              </Magnetic>

              <Link href="/#how-it-works" className="btn-secondary min-h-14">
                See how it works
              </Link>
            </div>
          </div>

          {/* Formats strip, in place of the usual logo wall. */}
          <div className="mx-auto mt-24 max-w-6xl border-y border-white/5 bg-white/[0.02] py-8 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 px-6 md:flex-row md:gap-14">
              <p className="shrink-0 text-xs font-bold uppercase tracking-label text-zinc-500">
                Reads
              </p>
              <ul className="flex w-full list-none flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-12">
                {FORMATS.map((f) => (
                  <li key={f} className="font-display text-base font-semibold text-zinc-400">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* A continuous band of readings, closing the hero. */}
        <ScoreTicker />

        {/* ===================== PROBLEM ===================== */}
        <section id="problem" className="scroll-mt-28 px-[var(--gutter)] py-[var(--band)]">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              {STATS.map((s, i) => (
                <Reveal key={s.claim} delay={i * 90}>
                  <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/50 to-black p-8">
                    <span className="font-display text-6xl font-bold leading-none tracking-tightest">
                      <CountUp to={s.to} suffix={s.suffix} />
                    </span>
                    <p className="mt-5 text-base leading-snug text-zinc-300">{s.claim}</p>
                    <p className="mt-auto pt-6 text-[11px] leading-relaxed text-zinc-600">
                      Source: {s.source}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </section>

        {/* ===================== FEATURES ===================== */}
        <section id="features" className="scroll-mt-28 px-[var(--gutter)] py-[var(--band)]">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="t-h2">
                Everything you&rsquo;d
                <br />
                <span className="text-zinc-500">otherwise look up.</span>
              </h2>
              <p className="mt-6 text-lg font-light leading-relaxed text-zinc-400">
                Seven answers from one scan, in one place, in plain English.
              </p>
            </Reveal>

            <FeatureBento />
          </div>
        </section>

        {/* ===================== HOW IT WORKS ===================== */}
        <section id="how-it-works" className="scroll-mt-28 px-[var(--gutter)] py-[var(--band)]">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="t-h2">Three steps to an answer.</h2>
              <p className="mt-6 text-lg font-light leading-relaxed text-zinc-400">
                No forms, no sign up to try it. Just point your camera.
              </p>
            </Reveal>
            <ScanSteps />
          </div>
        </section>

        {/* ===================== DIFFERENCE ===================== */}
        <section className="px-[var(--gutter)] py-[var(--band)]">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mx-auto mb-14 max-w-3xl text-center">
              <h2 className="t-h2">
                How we compare
                <br />
                <span className="text-zinc-500">to reading it yourself.</span>
              </h2>
            </Reveal>

            <Reveal>
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/50 to-black">
                <table className="w-full min-w-[640px] border-collapse">
                  <caption className="sr-only">
                    BarcodeSense compared with reading the label yourself and with basic scanning apps
                  </caption>
                  <thead>
                    <tr className="border-b border-white/10">
                      <th scope="col" className="px-6 py-5 text-left text-xs font-bold uppercase tracking-label text-zinc-500">
                        Capability
                      </th>
                      <th scope="col" className="px-4 py-5 text-center text-xs font-bold uppercase tracking-label text-white">
                        BarcodeSense
                      </th>
                      <th scope="col" className="px-4 py-5 text-center text-xs font-bold uppercase tracking-label text-zinc-500">
                        Reading it yourself
                      </th>
                      <th scope="col" className="px-4 py-5 text-center text-xs font-bold uppercase tracking-label text-zinc-500">
                        Basic apps
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row) => (
                      <tr key={row.feature} className="border-b border-white/5 last:border-b-0">
                        <th scope="row" className="px-6 py-5 text-left text-sm font-medium text-zinc-200">
                          {row.feature}
                        </th>
                        {([row.us, row.manual, row.basic] as const).map((v, i) => {
                          const m = MARK[v]
                          return (
                            <td key={i} className="px-4 py-5">
                              {/* The glyph never carries the meaning alone. */}
                              <span className={`flex items-center justify-center gap-2 ${m.cls}`}>
                                <m.Icon className="h-4 w-4" aria-hidden="true" />
                                <span className="text-xs font-semibold uppercase tracking-wide">
                                  {m.text}
                                </span>
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===================== PRIVACY ===================== */}
        <section className="px-[var(--gutter)] py-[var(--band)]">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mx-auto mb-14 max-w-3xl text-center">
              <h2 className="t-h2">Your scans stay yours.</h2>
              <p className="mt-6 text-lg font-light leading-relaxed text-zinc-400">
                We never share or sell what you scan. There are no ads in the app and no brand can
                pay to change a score. We&rsquo;re here to help you shop, not to sell you to anyone.
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PRIVACY.map((p, i) => (
                <Reveal key={p.t} delay={i * 70}>
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-7">
                    <h3 className="font-display text-lg font-semibold tracking-tight">{p.t}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{p.b}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== PRICING ===================== */}
        <section id="pricing" className="scroll-mt-28 px-[var(--gutter)] py-[var(--band)]">
          <div className="mx-auto max-w-4xl">
            <Reveal className="mb-16 text-center">
              <h2 className="t-h2">Free, forever.</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-zinc-400">
                Every feature, unlimited scans. The AI runs on your own key, billed at cost by your
                provider.
              </p>
            </Reveal>

            <div className="mx-auto max-w-md">
              <Reveal>
                <div className="relative flex h-full flex-col rounded-2xl border border-white bg-white/[0.04] p-8 shadow-[0_0_40px_rgba(255,255,255,0.06)]">
                  <h3 className="font-display text-xl font-bold">Free</h3>
                  <p className="mt-2 h-10 text-sm text-zinc-400">
                    Everything the app does, on your own key.
                  </p>
                  <div className="mb-8 mt-6 flex items-baseline gap-1">
                    <span className="text-zinc-500">$</span>
                    <span className="font-display text-5xl font-bold">
                      <CountUp to={0} duration={900} />
                    </span>
                    <span className="text-sm text-zinc-500">forever</span>
                  </div>
                  <ul className="mb-8 flex-1 list-none space-y-4">
                    {[
                      'Unlimited barcode scans',
                      'Full ingredients and nutrition',
                      'Scan history, synced across your devices',
                      'Unlimited AI insights with your own free key',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-zinc-200">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/app" className="btn-primary w-full">
                    {primaryLabel}
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ===================== FAQ ===================== */}
        <section id="faq" className="scroll-mt-28 px-[var(--gutter)] py-[var(--band)]">
          <div className="mx-auto max-w-3xl">
            <Reveal className="mb-14 text-center">
              <h2 className="t-h2">Frequently asked questions.</h2>
            </Reveal>

            <ul className="m-0 list-none space-y-3">
              {FAQ.map((f, i) => (
                <Reveal as="li" key={f.q} delay={i * 60}>
                  <details className="group rounded-2xl border border-white/10 bg-white/[0.02] px-6 transition-colors duration-[260ms] hover:border-white/20 open:bg-white/[0.04]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-lg font-semibold tracking-tight marker:hidden">
                      {f.q}
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-2xl font-light leading-none text-zinc-500 transition-transform duration-[260ms] ease-scan group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="pb-7 text-[0.95rem] leading-relaxed text-zinc-400">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ===================== CTA ===================== */}
        <section className="px-[var(--gutter)] py-[var(--band)] text-center">
          <Reveal className="mx-auto max-w-3xl">
            <h2 className="t-display text-balance">
              <span className="text-fade">Start with whatever</span>
              <br />
              <span>is in your cupboard.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-lg text-zinc-400">
              It takes seconds. Free to start, and no card needed.
            </p>

            <div className="mt-12 flex items-center justify-center">
              <Magnetic strength={10}>
                <Link
                  href="/app"
                  className="shiny-cta group inline-flex min-h-14 items-center justify-center rounded-full px-10"
                >
                  <span className="relative z-10 flex items-center gap-2 font-semibold text-white">
                    {cta}
                  </span>
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}
