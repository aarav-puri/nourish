'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import type { Food } from '@/lib/food'

/** A small product photo on white, falling back to a quiet package glyph. */
export default function ProductThumb({ food, size = 44 }: { food: Food; size?: number }) {
  const [ok, setOk] = useState(true)
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-neu-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {food.image && ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={food.image} alt="" loading="lazy" decoding="async" onError={() => setOk(false)} className="h-full w-full object-contain p-1" />
      ) : (
        <Package className="h-1/2 w-1/2 text-[#8a867c]" />
      )}
    </span>
  )
}
