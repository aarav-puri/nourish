import LabelLens from '@/components/home/LabelLens'

/** The headline, beside a pack label that reads itself. */
export default function Hero() {
  return (
    <section aria-labelledby="hero-h" className="overflow-x-clip px-[var(--gutter)] pb-16 pt-8 sm:pt-12 lg:pb-20 lg:pt-14">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="motion-safe:animate-rise">
          <h1
            id="hero-h"
            className="max-w-[11ch] font-display text-[clamp(2.9rem,6.4vw,5.4rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink"
          >
            The small print<span className="-ml-[0.06em]">,</span> read for you<span className="-ml-[0.06em]">.</span>
          </h1>
          <p className="mt-6 max-w-[26rem] text-lg leading-relaxed text-ink-2 sm:text-xl sm:leading-relaxed">
            Scan a barcode and see what’s in it, in plain words, checked against your diet and allergies.
          </p>
        </div>
        <div className="mx-auto w-full max-w-[30rem] lg:mr-0">
          <LabelLens />
        </div>
      </div>
    </section>
  )
}
