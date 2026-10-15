'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { WordsPullUp } from '@/components/ui/words-pull-up'
import heroImage from '@/assets/hero-market.jpg'

/**
 * Full-bleed hero under the navigation bar: a framed photograph with the
 * name set huge along the bottom, and the pitch and one action beside it.
 */
export default function Hero() {
  const { user } = useAuth()

  return (
    <section aria-label="Nourish" className="h-[calc(100svh-4rem)] min-h-[520px] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#1d1a14] shadow-neu">
        <Image
          src={heroImage}
          alt=""
          priority
          placeholder="blur"
          sizes="100vw"
          className="hero-drift absolute inset-0 h-full w-full object-cover [filter:brightness(0.5)_saturate(0.8)_sepia(0.2)_contrast(1.05)]"
        />

        <div aria-hidden="true" className="noise-overlay pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/85"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_100%_100%,rgba(0,0,0,0.6),transparent_65%)]"
        />


        <div className="absolute inset-x-0 bottom-0 px-4 pb-2 sm:px-6 md:px-10">
          <div className="grid grid-cols-12 items-end gap-x-4">
            <div className="col-span-12 lg:col-span-8">
              <h1 className="font-display font-extrabold leading-[0.85] tracking-[-0.06em] text-white text-[26vw] sm:text-[24vw] lg:text-[18.5vw]">
                <WordsPullUp text="nourish" />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-6 pt-3 lg:col-span-4 lg:pb-12 lg:pt-0">
              <p
                className="pull-up max-w-md text-sm leading-snug text-white/85 sm:text-base md:text-lg"
                style={{ animationDelay: '0.5s' }}
              >
                Scan a barcode and see the grade, the sugar, the additives and anything you avoid, before it goes in
                your basket.
              </p>

              <div className="pull-up flex flex-wrap items-center gap-x-5 gap-y-3" style={{ animationDelay: '0.7s' }}>
                <Link
                  href="/app"
                  className="group inline-flex items-center gap-2 rounded-full bg-white py-1 pl-6 pr-1 text-sm font-semibold text-[#3D4852] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)] transition-all duration-300 hover:gap-3 active:shadow-[inset_3px_3px_6px_rgb(163_177_198/0.6)] sm:text-base"
                >
                  {user ? 'Open scanner' : 'Scan your first product'}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163_177_198/0.7),inset_-3px_-3px_6px_rgb(255_255_255/0.9)] transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4 text-[#3D4852]" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
