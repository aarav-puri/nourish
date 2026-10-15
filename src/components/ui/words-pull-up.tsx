import type { CSSProperties } from 'react'

interface WordsPullUpProps {
  text: string
  className?: string
  /** Seconds before the first word starts. */
  delay?: number
  /** Content set after the last word, such as a footnote mark. */
  after?: React.ReactNode
  style?: CSSProperties
}

/**
 * Words that rise into place one after another. Pure CSS, so it needs no
 * motion library and runs before hydration; reduced motion skips it.
 */
export function WordsPullUp({ text, className = '', delay = 0, after, style }: WordsPullUpProps) {
  const words = text.split(' ').filter(Boolean)
  return (
    <span className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => (
        <span
          key={i}
          className="pull-up relative inline-block"
          style={{ animationDelay: `${delay + i * 0.08}s`, marginRight: i === words.length - 1 ? 0 : '0.25em' }}
        >
          {word}
          {i === words.length - 1 && after}
        </span>
      ))}
    </span>
  )
}
