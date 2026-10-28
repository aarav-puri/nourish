'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, Search, ShieldAlert, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { SCORE_BANDS, toFood, type Food, type Grade } from '@/lib/food'
import { checkProduct, dietLabel, isProfileEmpty, overallStatus } from '@/lib/profile'
import { productCache } from '@/lib/scan-cache'
import { dayBucket, timeAgo } from '@/lib/time'
import AppShell from '@/components/app/AppShell'
import PageHeader from '@/components/app/PageHeader'
import ChatAgent from '@/components/ChatAgent'
import { GRADE_STYLE, ScoreBadge } from '@/components/product/Grade'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface Entry {
  barcode: string
  food: Food
  lastScanned: string
  times: number
  conflict: boolean
}

type Filter = 'all' | 'good' | 'middle' | 'poor' | 'conflict'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'good', label: '60+' },
  { id: 'middle', label: '40–59' },
  { id: 'poor', label: 'Under 40' },
  { id: 'conflict', label: 'Not for me' },
]

const UNDO_MS = 5000

export default function HistoryPage() {
  return (
    <AppShell>
      <History />
    </AppShell>
  )
}

function History() {
  const router = useRouter()
  const { profile } = useAuth()
  const [rows, setRows] = useState<any[] | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const load = useCallback(() => {
    setError(false)
    db.getScannedProducts(500)
      .then((data) => setRows(data ?? []))
      .catch(() => setError(true))
  }, [])

  useEffect(load, [load])

  // Commit any deletions still waiting on their undo window when leaving.
  useEffect(() => {
    const map = pending.current
    return () => {
      map.forEach((t, barcode) => {
        clearTimeout(t)
        commitDelete(barcode)
      })
    }
  }, [])

  const profileEmpty = isProfileEmpty(profile)

  const entries = useMemo<Entry[]>(() => {
    if (!rows) return []
    const byCode = new Map<string, Entry>()
    for (const row of rows) {
      const key = row.barcode || row.id
      const existing = byCode.get(key)
      if (existing) {
        existing.times += 1
        continue
      }
      const food = toFood(row.product_data, row.barcode)
      byCode.set(key, {
        barcode: key,
        food,
        lastScanned: row.scanned_at,
        times: 1,
        conflict: !profileEmpty && overallStatus(checkProduct(food, profile)) === 'conflict',
      })
    }
    return Array.from(byCode.values())
  }, [rows, profile, profileEmpty])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (hidden.has(e.barcode)) return false
      if (q && !`${e.food.name} ${e.food.brand ?? ''} ${e.barcode}`.toLowerCase().includes(q)) return false
      const g = e.food.grade
      if (filter === 'good') return g === 'a' || g === 'b'
      if (filter === 'middle') return g === 'c'
      if (filter === 'poor') return g === 'd' || g === 'e'
      if (filter === 'conflict') return e.conflict
      return true
    })
  }, [entries, hidden, query, filter])

  const groups = useMemo(() => {
    const out: { label: string; items: Entry[] }[] = []
    for (const e of visible) {
      const label = dayBucket(e.lastScanned)
      const last = out[out.length - 1]
      if (last?.label === label) last.items.push(e)
      else out.push({ label, items: [e] })
    }
    return out
  }, [visible])

  const counts = useMemo(() => {
    const c: Record<Grade | 'none', number> = { a: 0, b: 0, c: 0, d: 0, e: 0, none: 0 }
    for (const e of entries) if (!hidden.has(e.barcode)) c[e.food.grade ?? 'none']++
    return c
  }, [entries, hidden])

  const openEntry = (e: Entry) => {
    productCache.set(e.barcode, e.food)
    router.push(`/app?code=${encodeURIComponent(e.barcode)}`)
  }

  async function commitDelete(barcode: string) {
    pending.current.delete(barcode)
    try {
      await Promise.all([db.deleteScansByBarcode(barcode), db.deleteAIInsightsByBarcode(barcode)])
      productCache.delete(barcode)
      setRows((r) => r?.filter((row) => (row.barcode || row.id) !== barcode) ?? r)
    } catch {
      toast.error('Could not delete that scan. It is back in your list.')
    }
    setHidden((h) => {
      const next = new Set(h)
      next.delete(barcode)
      return next
    })
  }

  const remove = (e: Entry) => {
    setHidden((h) => new Set(h).add(e.barcode))
    const t = setTimeout(() => commitDelete(e.barcode), UNDO_MS)
    pending.current.set(e.barcode, t)
    toast(`Removed ${e.food.name}`, {
      duration: UNDO_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(pending.current.get(e.barcode))
          pending.current.delete(e.barcode)
          setHidden((h) => {
            const next = new Set(h)
            next.delete(e.barcode)
            return next
          })
        },
      },
    })
  }

  const clearAll = async () => {
    setClearing(true)
    try {
      await db.clearAllAIInsights()
      await db.clearAllScannedProducts()
      productCache.clear()
      setRows([])
      setConfirmClear(false)
      toast.success('History cleared')
    } catch {
      toast.error('Could not clear history. Try again.')
    }
    setClearing(false)
  }

  // A compact, readable summary for Nourish AI rather than raw database records.
  const chatContext = useMemo(
    () => ({
      profile: { diets: profile.diets.map(dietLabel), avoids: profile.avoid },
      products: entries.slice(0, 60).map(({ food, lastScanned, times }) => ({
        name: food.name,
        brand: food.brand,
        health_score_out_of_100: food.score,
        processing_nova: food.nova,
        per_100g: food.nutrition,
        allergens: food.allergens,
        vegan: food.vegan,
        vegetarian: food.vegetarian,
        additives: food.additives.length,
        ingredients: food.ingredientsText?.slice(0, 400),
        last_scanned: lastScanned,
        times_scanned: times,
      })),
    }),
    [entries, profile]
  )

  const total = entries.length - hidden.size

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="History."
        subtitle={rows === null ? '\u00a0' : total === 0 ? 'Nothing here yet.' : `${total} product${total === 1 ? '' : 's'} scanned`}
        actions={
          total > 0 && (
            <Button variant="secondary" onClick={() => setChatOpen(true)}>
              Ask Nourish AI
            </Button>
          )
        }
      />

      {error ? (
        <div className="card mt-8 p-6 text-center">
          <p className="font-medium">Your history did not load</p>
          <p className="mt-1 text-sm text-ink-2">Check your connection and try again.</p>
          <Button variant="secondary" className="mt-4" onClick={load}>
            Try again
          </Button>
        </div>
      ) : rows === null ? (
        <ListSkeleton />
      ) : total === 0 ? (
        <EmptyHistory />
      ) : (
        <>
          <GradeMix counts={counts} total={total} />

          <div className="app-sticky-tools sticky top-20 z-10 -mx-3 mt-6 rounded-3xl px-3 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                <label htmlFor="history-search" className="sr-only">
                  Search history
                </label>
                <input
                  id="history-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, brand or barcode"
                  className="field pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="btn-icon absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              {/* A pressed-in track with the chosen filter raised out of it. The
                  scroller is padded so no shadow is clipped at its edges. */}
              <div className="-m-3 overflow-x-auto p-3">
                <div className="inline-flex gap-1 rounded-full bg-paper p-1.5 shadow-neu-inset-sm" role="radiogroup" aria-label="Filter by grade">
                {FILTERS.filter((f) => f.id !== 'conflict' || !profileEmpty).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-checked={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={`h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-[color,box-shadow] duration-300 ease-out ${
                      filter === f.id ? 'bg-paper text-ink shadow-neu-sm' : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-medium">No matches</p>
              <p className="mt-1 text-sm text-ink-2">Try a different search or filter.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
                className="mt-3 text-sm font-medium underline decoration-ink/30 underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-6">
              {groups.map((g) => (
                <section key={g.label} aria-label={g.label}>
                  <h2 className="t-eyebrow mb-1">{g.label}</h2>
                  <ul className="divide-y divide-line">
                    {g.items.map((e) => (
                      <li key={e.barcode} className="group flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEntry(e)}
                          className="-ml-2 flex min-w-0 flex-1 items-center gap-3.5 rounded-lg py-3 pl-2 pr-1 text-left transition-colors hover:bg-ink/[0.03]"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">{e.food.name}</span>
                              {e.conflict && (
                                <ShieldAlert className="h-4 w-4 shrink-0 text-level-high" aria-label="Does not fit your profile" />
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-sm text-ink-3">
                              {[e.food.brand, timeAgo(e.lastScanned), e.times > 1 ? `scanned ${e.times}×` : null]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </span>
                          <ScoreBadge grade={e.food.grade} score={e.food.score} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(e)}
                          aria-label={`Remove ${e.food.name} from history`}
                          className="btn-icon text-ink-3 opacity-100 hover:text-level-high sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="mt-12 border-t border-line pt-6">
            <button type="button" onClick={() => setConfirmClear(true)} className="text-sm font-medium text-ink-3 hover:text-level-high">
              Clear all history
            </button>
          </div>
        </>
      )}

      <Modal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all history?"
        description="Every scan and saved AI answer will be deleted. This cannot be undone."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={clearing} onClick={clearAll}>
              Clear history
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-2">
          You have {total} product{total === 1 ? '' : 's'} in your history.
        </p>
      </Modal>

      <ChatAgent open={chatOpen} onClose={() => setChatOpen(false)} context={chatContext} />
    </div>
  )
}

/** How a person's scans spread across the grades: their shopping at a glance. */
function GradeMix({ counts, total }: { counts: Record<Grade | 'none', number>; total: number }) {
  const graded = total - counts.none
  if (graded < 3) return null
  const good = counts.a + counts.b
  const pct = Math.round((good / graded) * 100)
  return (
    <section aria-label="Grade mix" className="card mt-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink-2">
          <span className="font-display font-bold text-2xl text-ink">{pct}%</span>
          <span className="ml-2">of what you scan scores 60 or higher</span>
        </p>
        <span className="font-mono text-xs text-ink-3">{graded} scored</span>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full" role="img" aria-label={(['a', 'b', 'c', 'd', 'e'] as Grade[]).map((g) => `${SCORE_BANDS[g][0]} to ${SCORE_BANDS[g][1]}: ${counts[g]}`).join(', ')}>
        {(['a', 'b', 'c', 'd', 'e'] as Grade[]).map((g) =>
          counts[g] > 0 ? <span key={g} className={GRADE_STYLE[g].split(' ')[0]} style={{ width: `${(counts[g] / graded) * 100}%` }} /> : null
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {(['a', 'b', 'c', 'd', 'e'] as Grade[]).map((g) => (
          <span key={g} className="flex items-center gap-1.5 font-mono text-xs text-ink-3">
            <span className={`h-2 w-2 rounded-full ${GRADE_STYLE[g].split(' ')[0]}`} aria-hidden="true" />
            {SCORE_BANDS[g][0]}–{SCORE_BANDS[g][1]}: {counts[g]}
          </span>
        ))}
      </div>
    </section>
  )
}

function EmptyHistory() {
  return (
    <div className="card mt-8 flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
        <Camera className="h-5 w-5 text-ink-2" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display font-bold text-xl">Your scans will collect here</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-2">
        Every product you scan is saved with its grade, so you can compare, search, and ask questions about them later.
      </p>
      <Link href="/app" className="btn-primary mt-6">
        Scan your first product
      </Link>
    </div>
  )
}

function ListSkeleton() {
  return (
    <ul className="mt-8 divide-y divide-line" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-center gap-3.5 py-3">
          <div className="skeleton h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-1/3" />
          </div>
          <div className="skeleton h-9 w-9 rounded-lg" />
        </li>
      ))}
    </ul>
  )
}
