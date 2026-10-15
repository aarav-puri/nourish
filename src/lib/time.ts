const rtf = typeof Intl !== 'undefined' ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }) : null

/** "just now", "5 min ago", "yesterday", then a short date. */
export function timeAgo(iso: string) {
  const then = new Date(iso).getTime()
  const diff = (Date.now() - then) / 1000
  if (diff < 45) return 'just now'
  if (diff < 3600) return rtf?.format(-Math.round(diff / 60), 'minute') ?? ''
  if (diff < 86400) return rtf?.format(-Math.round(diff / 3600), 'hour') ?? ''
  if (diff < 86400 * 6) return rtf?.format(-Math.round(diff / 86400), 'day') ?? ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Groups a date into the buckets a history list is read in. */
export function dayBucket(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(today) - start(d)) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'This week'
  if (days < 31) return 'This month'
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
