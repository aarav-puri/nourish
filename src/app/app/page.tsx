'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Camera, PenLine, RotateCcw, SearchX, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/supabase'
import { getGeminiApiKey } from '@/lib/ai-service'
import { fetchProductInfo, LookupError } from '@/lib/product-api'
import { toFood, type Food } from '@/lib/food'
import { productCache } from '@/lib/scan-cache'
import AppShell from '@/components/app/AppShell'
import CameraScanner from '@/components/app/CameraScanner'
import ManualEntry from '@/components/app/ManualEntry'
import ScannerHome from '@/components/app/ScannerHome'
import ProductReport from '@/components/product/ProductReport'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

const cache = productCache

type View =
  | { kind: 'idle' }
  | { kind: 'loading'; code: string }
  | { kind: 'result'; food: Food }
  | { kind: 'notfound'; code: string }
  | { kind: 'error'; code: string; message: string; offline?: boolean }
  | { kind: 'manual'; code: string }

export default function ScannerPage() {
  return (
    <AppShell wide>
      <Suspense fallback={null}>
        <Scanner />
      </Suspense>
    </AppShell>
  )
}

function Scanner() {
  const router = useRouter()
  const params = useSearchParams()
  const code = params.get('code')
  const manual = params.get('manual') === '1'
  // Changes on "Try again" for the same code, to re-run the lookup.
  const attempt = params.get('r')
  const { user } = useAuth()

  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [view, setView] = useState<View>({ kind: 'idle' })
  const [camera, setCamera] = useState(false)
  const requestRef = useRef(0)

  useEffect(() => {
    const present = Boolean(getGeminiApiKey())
    setHasKey(present)
    if (!present) router.replace(`/setup?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
  }, [router])

  const warmHistoryCache = useCallback(() => {
    db.getScannedProducts(40)
      .then((rows) => {
        const seen = new Set<string>()
        for (const row of rows ?? []) {
          if (!row.barcode || seen.has(row.barcode)) continue
          seen.add(row.barcode)
          const food = toFood(row.product_data, row.barcode)
          if (!cache.has(row.barcode)) cache.set(row.barcode, food)
        }
      })
      .catch(() => { /* History cache warming is optional. */ })
  }, [])

  useEffect(() => {
    if (user) warmHistoryCache()
  }, [user, warmHistoryCache])

  /* The URL is the source of truth: ?code= shows a product, so the back
     button returns to the scanner and a result survives a refresh. */
  useEffect(() => {
    if (!code) {
      setView({ kind: 'idle' })
      return
    }
    if (manual) {
      setView({ kind: 'manual', code })
      return
    }
    const cached = cache.get(code)
    if (cached) {
      setView({ kind: 'result', food: cached })
      return
    }
    if (!getGeminiApiKey()) return

    const id = ++requestRef.current
    const controller = new AbortController()
    setView({ kind: 'loading', code })

    fetchProductInfo(code, controller.signal)
      .then(async (data) => {
        if (id !== requestRef.current) return
        if (data.status !== 1 || !data.product) {
          setView({ kind: 'notfound', code })
          return
        }
        const food = toFood(data.product, code)
        cache.set(code, food)
        setView({ kind: 'result', food })
        try {
          await db.saveScannedProduct(code, food.name, data.product)
          warmHistoryCache()
        } catch {
          /* the result is on screen; history is best effort */
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || id !== requestRef.current) return
        const offline = typeof navigator !== 'undefined' && !navigator.onLine
        setView({
          kind: 'error',
          code,
          offline,
          message: offline
            ? 'You are offline. Reconnect and try again.'
            : err instanceof LookupError
              ? err.message
              : 'Something went wrong looking that up.',
        })
      })

    return () => controller.abort()
  }, [code, manual, attempt, hasKey, warmHistoryCache])

  const open = useCallback(
    (barcode: string) => {
      const clean = barcode.replace(/\D/g, '')
      if (clean.length < 6 || clean.length > 14) {
        toast.error('A barcode is 6 to 14 digits. Check the number under the bars.')
        return
      }
      if (clean === code) {
        // Same code again: a retry rather than a navigation.
        cache.delete(clean)
        router.replace(`/app?code=${clean}&r=${Date.now()}`, { scroll: false })
        return
      }
      router.push(`/app?code=${clean}`, { scroll: true })
    },
    [router, code]
  )

  const back = () => {
    if (window.history.length > 1) router.back()
    else router.push('/app')
  }

  // No key in this browser: setup collects it (and the food profile) first.
  if (!hasKey) return null

  switch (view.kind) {
    case 'loading':
      return <LoadingReport code={view.code} onCancel={back} />

    case 'result':
      return (
        <div>
          <BackBar onBack={back} />
          <ProductReport
            food={view.food}
            actions={
              <Button variant="secondary" size="sm" icon={<Camera className="h-4 w-4" aria-hidden="true" />} onClick={() => setCamera(true)}>
                Scan next
              </Button>
            }
          />
          <FloatingScan onClick={() => setCamera(true)} />
          {camera && (
            <CameraScanner
              onDetected={(c) => {
                setCamera(false)
                open(c)
              }}
              onClose={() => setCamera(false)}
              onTypeInstead={() => {
                setCamera(false)
                router.push('/app')
              }}
            />
          )}
        </div>
      )

    case 'notfound':
      return (
        <StateCard
          icon={SearchX}
          title="Not in the database yet"
          body={
            <>
              No product uses <span className="font-mono text-ink">{view.code}</span> in Open Food Facts or Go-UPC.
              Newer and local products are often missing. Check the digits, or enter the details from the pack and
              we will analyse them.
            </>
          }
          onBack={back}
        >
          <Button icon={<PenLine className="h-4 w-4" aria-hidden="true" />} onClick={() => router.replace(`/app?code=${view.code}&manual=1`)}>
            Enter details from the pack
          </Button>
          <Button variant="secondary" onClick={() => router.push('/app')}>
            Try another barcode
          </Button>
        </StateCard>
      )

    case 'error':
      return (
        <StateCard
          icon={view.offline ? WifiOff : RotateCcw}
          title={view.offline ? 'No connection' : 'The lookup did not finish'}
          body={view.message}
          onBack={back}
        >
          <Button icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />} onClick={() => open(view.code)}>
            Try again
          </Button>
        </StateCard>
      )

    case 'manual':
      return (
        <div>
          <BackBar onBack={back} />
          <ManualEntry
            barcode={view.code}
            onDone={(food) => {
              cache.set(view.code || `manual-${Date.now()}`, food)
              setView({ kind: 'result', food })
            }}
          />
        </div>
      )

    default:
      return <ScannerHome onOpen={open} />
  }
}

/* ---------- Home: the scan surface --------------------------------- */

/* ---------- Pieces ------------------------------------------------- */

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="btn-ghost -ml-3 mb-4 h-9 min-h-9 px-3 text-ink-2">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Scanner
    </button>
  )
}

/** On phones, the next scan is always one thumb away while reading a result. */
function FloatingScan({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-accent pl-4 pr-5 text-sm font-semibold text-on-accent shadow-pop transition-transform active:scale-95 sm:hidden"
    >
      <Camera className="h-5 w-5" aria-hidden="true" />
      Scan next
    </button>
  )
}

function StateCard({
  icon: Icon,
  title,
  body,
  children,
  onBack,
}: {
  icon: typeof SearchX
  title: string
  body: React.ReactNode
  children: React.ReactNode
  onBack: () => void
}) {
  return (
    <div className="mx-auto max-w-lg">
      <BackBar onBack={onBack} />
      <div className="card animate-rise p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2">
          <Icon className="h-5 w-5 text-ink-2" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display font-bold text-2xl leading-tight">{title}</h1>
        <p className="mt-2 leading-relaxed text-ink-2">{body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">{children}</div>
      </div>
    </div>
  )
}

function LoadingReport({ code, onCancel }: { code: string; onCancel: () => void }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div role="status" aria-live="polite">
      <BackBar onBack={onCancel} />
      <span className="sr-only">Looking up {code}</span>
      <div className="flex items-start gap-5" aria-hidden="true">
        <div className="skeleton h-20 w-20 rounded-xl sm:h-24 sm:w-24" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-3 w-32" />
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6" aria-hidden="true">
        <div className="space-y-4">
          <div className="card h-56 p-6">
            <div className="skeleton h-3 w-20" />
            <div className="mt-6 flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-10 w-8" />
              ))}
            </div>
            <div className="skeleton mt-6 h-3 w-4/5" />
          </div>
          <div className="card h-28" />
        </div>
        <div className="card h-80 p-6">
          <div className="skeleton h-6 w-28" />
          <div className="mt-3 h-[6px] bg-ink/10" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton mt-5 h-3" />
          ))}
        </div>
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-ink-2">
        <Spinner />
        {slow ? 'Still working. The food database is slow right now.' : <>Looking up <span className="font-mono">{code}</span></>}
      </p>
    </div>
  )
}
