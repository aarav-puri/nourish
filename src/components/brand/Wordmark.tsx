/** The lowercase wordmark, pressed lightly into the clay, with a grey full stop. */
export default function Wordmark({ byline = false, className = '' }: { byline?: boolean; className?: string }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className="emboss flex items-baseline font-display text-[1.35rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink">
        nourish
        <span
          aria-hidden="true"
          className="mb-[0.04em] ml-[0.08em] inline-block h-[0.2em] w-[0.2em] rounded-full bg-ink-3"
        />
      </span>
      {byline && <span className="mt-1 text-[10px] font-medium lowercase tracking-wide text-ink-3">by nourish labs</span>}
    </span>
  )
}
