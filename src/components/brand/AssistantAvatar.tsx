interface AssistantAvatarProps {
  /** Rendered width and height in pixels. */
  size?: number
  /** Idle motion: a slow float, a swaying leaf and the odd blink. */
  animated?: boolean
  /** A quicker bob and a busy leaf, while an answer is on its way. */
  thinking?: boolean
  className?: string
}

/**
 * NourishAI, the Nourish assistant: a leaf-topped robot. The artwork is split
 * into layers (brand/scripts/nourishai-layers.py) so the leaf and eyes can move
 * on their own. Decorative only; the name always appears in text beside it.
 */
export default function AssistantAvatar({ size = 32, animated = true, thinking = false, className = '' }: AssistantAvatarProps) {
  const state = thinking ? 'assistant-thinking' : animated ? 'assistant-idle' : ''

  return (
    <span
      aria-hidden="true"
      className={`assistant-avatar ${state} inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="assistant-bot">
        {/* eslint-disable @next/next/no-img-element */}
        <img src="/nourishai/leaf.webp" alt="" className="assistant-leaf" draggable={false} />
        <img src="/nourishai/body.webp" alt="" draggable={false} />
        <img src="/nourishai/eye-l.webp" alt="" className="assistant-eye assistant-eye-l" draggable={false} />
        <img src="/nourishai/eye-r.webp" alt="" className="assistant-eye assistant-eye-r" draggable={false} />
        {/* eslint-enable @next/next/no-img-element */}
      </span>
    </span>
  )
}
