'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * How it works, driven by the scroll rather than described beside it.
 *
 * The rail on the left is sticky; its beam advances as each beat comes into
 * view, so the section reads as one instrument travelling through three
 * states instead of three separate cards. On small screens the rail collapses
 * into an inline index and every beat is simply stacked and legible.
 */

const STEPS = [
  {
    n: '01',
    title: 'Point your camera',
    body: "Camera, photo, or type the number by hand. It reads every format you will find on a shelf: EAN, UPC, Code 128 and Code 39.",
    readout: ['CAMERA', 'LIVE', 'EAN 13 LOCKED'],
  },
  {
    n: '02',
    title: 'We do the reading',
    body: 'We pull the ingredients, additives, nutrition and origin, then read them together. You get findings, not another table to work through.',
    readout: ['31 INGREDIENTS', '2 ADDITIVES', 'SUGAR 34g'],
  },
  {
    n: '03',
    title: 'You decide, and go',
    body: 'How healthy it is, whether it fits your diet, what its footprint looks like, and a better option if one exists. We save every scan to your history so you are not starting over next time.',
    readout: ['DIET: 4/6 PASS', 'ECO 2.1kg CO₂e', 'SWAP FOUND'],
  },
]

export default function ScanSteps() {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = refs.current.indexOf(entry.target as HTMLDivElement)
            if (i >= 0) setActive(i)
          }
        }
      },
      // Trigger around the middle of the viewport so the rail tracks reading.
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )

    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-20">
      {/* Rail */}
      <div className="hidden lg:block">
        <div className="sticky top-32">
          <p className="mb-6 text-xs font-bold uppercase tracking-label text-zinc-500">Sequence</p>
          <ol className="relative m-0 list-none border-l border-white/10 pl-6">
            {/* The beam: one transform, tracking the active beat. */}
            <span
              aria-hidden="true"
              className="absolute -left-px top-0 w-[2px] rounded-full bg-white transition-transform duration-[620ms] ease-scan"
              style={{
                height: `${100 / STEPS.length}%`,
                transform: `translateY(${active * 100}%)`,
              }}
            />
            {STEPS.map((s, i) => (
              <li key={s.n} className="py-5">
                <span
                  className={`block text-xs font-bold uppercase tracking-label transition-colors duration-[260ms] ${
                    i === active ? 'text-white' : 'text-zinc-600'
                  }`}
                >
                  {s.n}
                </span>
                <span
                  className={`mt-2 block font-display text-lg font-semibold leading-tight tracking-tight transition-colors duration-[260ms] ${
                    i === active ? 'text-white' : 'text-zinc-600'
                  }`}
                >
                  {s.title}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Beats */}
      <ol className="m-0 list-none space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <div
              ref={(el) => {
                refs.current[i] = el
              }}
              className={`rounded-2xl border p-7 transition-colors duration-[620ms] ease-scan sm:p-9 lg:min-h-[58vh] lg:flex lg:flex-col lg:justify-center ${
                i === active
                  ? 'border-white/25 bg-gradient-to-b from-zinc-900/60 to-black'
                  : 'border-white/10 bg-white/[0.015]'
              }`}
            >
              <div className="flex items-baseline gap-4">
                <span
                  className={`text-xs font-bold uppercase tracking-label ${
                    i === active ? 'text-white' : 'text-zinc-600'
                  }`}
                >
                  {s.n}
                </span>
                <h3 className="t-h3">{s.title}</h3>
              </div>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">{s.body}</p>

              <ul className="mt-8 flex flex-wrap gap-2">
                {s.readout.map((r, j) => (
                  <li
                    key={r}
                    className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-label transition-[opacity,border-color,color] duration-[260ms] ease-scan motion-reduce:transition-none ${
                      i === active
                        ? 'border-white/40 text-white opacity-100'
                        : 'border-white/10 text-zinc-500 opacity-70'
                    }`}
                    style={{ transitionDelay: i === active ? `${j * 70}ms` : '0ms' }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
