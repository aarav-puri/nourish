/**
 * One label and value on a hairline rule. The same row the landing page
 * diagrams use, so a real result reads like the promise did.
 */
export default function DataRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2.5 font-mono text-[11px] uppercase tracking-label last:border-b-0">
      <span className="text-zinc-500">{label}</span>
      <span className={strong ? 'font-bold text-white' : 'text-zinc-300'}>{value}</span>
    </div>
  )
}
