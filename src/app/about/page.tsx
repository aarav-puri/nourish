import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="px-[var(--gutter)] pb-24 pt-10 sm:pt-16">
        <article className="mx-auto max-w-3xl">
          <p className="t-eyebrow">About</p>
          <h1 className="t-display mt-3 text-balance">Built from a personal problem.</h1>

          <div className="mt-10 flex items-center gap-4">
            <Image src="/ap.jpeg" alt="Aarav Puri" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
            <div>
              <p className="font-medium">Aarav Puri</p>
              <a
                href="https://aaravpuri.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-ink-2 underline decoration-ink/30 underline-offset-4 hover:text-ink"
              >
                aaravpuri.org
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="prose-nourish mt-10 text-[1.0625rem] leading-8">
            <p>
              Nourish was born from a simple, everyday problem: my dad is vegetarian, and I kept noticing how often
              packaged foods quietly include ingredients that don&rsquo;t actually fit vegetarian diets. Hidden
              animal-derived ingredients, confusing labels and unclear nutritional information made grocery shopping
              unnecessarily complicated.
            </p>
            <p>
              I wanted a simple way to scan products and immediately know what&rsquo;s inside, not just for
              vegetarians but for anyone trying to make informed choices about what they eat.
            </p>
            <p>
              From there, the idea grew beyond checking ingredients. People need help understanding what they&rsquo;re
              eating and finding better options, with a single scan.
            </p>
            <p>
              The result is a focused tool that tells you what is in your food, checks it against the way you eat, and
              suggests something better when it should. It is powered by open data and AI, built from a personal
              problem, and designed to make better eating feel effortless.
            </p>
          </div>

          <div className="mt-14 flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display font-bold text-xl">Try it on whatever is in your kitchen.</p>
            <Link href="/app" className="btn-primary group h-12 px-6">
              Start scanning
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
