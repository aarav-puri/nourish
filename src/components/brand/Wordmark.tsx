import BrandMark from './BrandMark'

export default function Wordmark({ className = '' }: { byline?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark tile className="h-10 w-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.4rem] font-medium tracking-[-0.055em] text-ink">nourish</span>
      </span>
    </span>
  )
}
