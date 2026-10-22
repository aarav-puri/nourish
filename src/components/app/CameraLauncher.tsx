'use client'

import { useState } from 'react'
import { motion, useReducedMotion, type Transition } from 'motion/react'
import { Camera } from 'lucide-react'

const SPRING: Transition = { type: 'spring', stiffness: 420, damping: 28 }

// Each corner bracket: where it sits, and which way it moves to close in.
const CORNERS = [
  { pos: 'left-4 top-4 border-l-2 border-t-2 rounded-tl-xl', x: 1, y: 1 },
  { pos: 'right-4 top-4 border-r-2 border-t-2 rounded-tr-xl', x: -1, y: 1 },
  { pos: 'bottom-4 left-4 border-b-2 border-l-2 rounded-bl-xl', x: 1, y: -1 },
  { pos: 'bottom-4 right-4 border-b-2 border-r-2 rounded-br-xl', x: -1, y: -1 },
] as const

/**
 * The camera tab's one action, drawn as a viewfinder: corner brackets frame
 * a sage lens and close in, like a camera finding focus, when it is
 * hovered, focused or pressed.
 */
export default function CameraLauncher({ onOpen }: { onOpen: () => void }) {
  const reduce = useReducedMotion()
  const [focus, setFocus] = useState<'rest' | 'aim' | 'press'>('rest')
  const inset = focus === 'press' ? 22 : focus === 'aim' ? 12 : 0

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onHoverStart={() => setFocus('aim')}
      onHoverEnd={() => setFocus('rest')}
      onFocus={() => setFocus('aim')}
      onBlur={() => setFocus('rest')}
      onTapStart={() => setFocus('press')}
      onTap={() => setFocus('aim')}
      onTapCancel={() => setFocus('rest')}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={SPRING}
      className="camera-launcher group relative flex h-56 w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[1.5rem] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:h-60"
    >
      {CORNERS.map((c) => (
        <motion.span
          key={c.pos}
          aria-hidden="true"
          className={`absolute h-9 w-9 border-accent/70 ${c.pos}`}
          animate={{ x: c.x * inset, y: c.y * inset, opacity: focus === 'rest' ? 0.55 : 1 }}
          transition={reduce ? { duration: 0 } : SPRING}
        />
      ))}

      <span aria-hidden="true" className="relative grid place-items-center">
        {!reduce && (
          <motion.span
            className="absolute h-[4.5rem] w-[4.5rem] rounded-full bg-accent/25"
            animate={{ scale: [1, 1.6], opacity: [0.55, 0] }}
            transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.6 }}
          />
        )}
        <motion.span
          className="relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-accent text-on-accent shadow-[0_12px_28px_-10px_rgb(var(--accent)/0.7)]"
          animate={{ scale: focus === 'press' ? 0.9 : focus === 'aim' ? 1.06 : 1 }}
          transition={reduce ? { duration: 0 } : SPRING}
        >
          <Camera className="h-7 w-7" strokeWidth={1.75} />
        </motion.span>
      </span>

      <span className="font-display text-base font-semibold tracking-tight">Open camera</span>
    </motion.button>
  )
}
