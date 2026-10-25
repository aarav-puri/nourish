import { Package } from 'lucide-react'
import type { Food } from '@/lib/food'

/** A small product tile with a quiet package glyph. */
export default function ProductThumb({ food, size = 44 }: { food: Food; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-neu-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Package className="h-1/2 w-1/2 text-[#8a867c]" />
    </span>
  )
}
