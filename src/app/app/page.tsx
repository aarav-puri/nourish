'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Camera, ImageUp, PenLine, RotateCcw, Search, SearchX, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/supabase'
import { getGeminiApiKey } from '@/lib/ai-service'
import { fetchProductInfo, LookupError } from '@/lib/product-api'
import { decodeImage, isValidGtin } from '@/lib/barcode'
import { toFood, type Food } from '@/lib/food'
import { isProfileEmpty } from '@/lib/profile'
import { productCache } from '@/lib/scan-cache'
import AppShell from '@/components/app/AppShell'
import CameraScanner from '@/components/app/CameraScanner'
import ManualEntry from '@/components/app/ManualEntry'
import RecentScans, { type RecentScan } from '@/components/app/RecentScans'
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
  const [recent, setRecent] = useState<RecentScan[] | null>(null)
  const requestRef = useRef(0)

  useEffect(() => {
    const present = Boolean(getGeminiApiKey())
    setHasKey(present)
    if (!present) router.replace(`/setup?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
  }, [router])

  const loadRecent = useCallback(() => {
    db.getScannedProducts(40)
      .then((rows) => {
        const seen = new Set<string>()
        const list: RecentScan[] = []
        for (const row of rows ?? []) {
          if (!row.barcode || seen.has(row.barcode)) continue
          seen.add(row.barcode)
          const food = toFood(row.product_data, row.barcode)
          list.push({ id: row.id, food, scannedAt: row.scanned_at })
          if (!cache.has(row.barcode)) cache.set(row.barcode, food)
        }
        setRecent(list.slice(0, 6))
      })
      .catch(() => setRecent([]))
  }, [])

  useEffect(() => {
    if (user) loadRecent()
  }, [user, loadRecent])

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
          loadRecent()
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
  }, [code, manual, attempt, hasKey, loadRecent])

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
      return <Home onOpen={open} recent={recent} />
  }
}

/* ---------- Home: the scan surface --------------------------------- */

function Home({ onOpen, recent }: { onOpen: (code: string) => void; recent: RecentScan[] | null }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [camera, setCamera] = useState(false)
  const [number, setNumber] = useState('')
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const numberRef = useRef<HTMLInputElement>(null)

  const readPhoto = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('That is not an image. Use a photo of the barcode.')
        return
      }
      setReading(true)
      try {
        const code = await decodeImage(file)
        if (code) onOpen(code)
        else
          toast.error('No barcode found in that photo', {
            description: 'Get closer, keep it flat and in focus, or type the number.',
          })
      } catch {
        toast.error('Could not read that image.')
      } finally {
        setReading(false)
      }
    },
    [onOpen]
  )

  // Paste a screenshot or photo anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((i) => i.type.startsWith('image/'))
        ?.getAsFile()
      if (file) {
        e.preventDefault()
        readPhoto(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [readPhoto])

  const submitNumber = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = number.replace(/\D/g, '')
    if (!clean) {
      numberRef.current?.focus()
      return
    }
    if ([8, 12, 13].includes(clean.length) && !isValidGtin(clean)) {
      toast('That check digit looks off', { description: 'Looking it up anyway. Double-check the last digit if nothing comes back.' })
    }
    onOpen(clean)
  }

  return (
    <div
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault()
          setDragging(true)
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
        if (file) readPhoto(file)
      }}
      className="relative"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <section aria-labelledby="scan-h">
          <h1 id="scan-h" className="sr-only">
            Scan a product
          </h1>

          {/* Camera: the primary action, sized for a thumb. */}
          <button type="button" onClick={() => setCamera(true)} className="btn-primary h-16 w-full gap-3 rounded-2xl text-base">
            <Camera className="h-5 w-5" aria-hidden="true" />
            Scan with camera
          </button>

          <div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={reading}
              className={`btn-secondary h-12 px-4 ${dragging ? 'ring-2 ring-ink/40 ring-offset-2 ring-offset-paper' : ''}`}
            >
              {reading ? <Spinner /> : <ImageUp className="h-4 w-4" aria-hidden="true" />}
              {reading ? 'Reading photo' : dragging ? 'Drop to read' : 'Upload a photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) readPhoto(f)
              }}
            />

            <form onSubmit={submitNumber} className="flex gap-2" role="search" aria-label="Look up a barcode number">
              <label htmlFor="barcode-number" className="sr-only">
                Barcode number
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                <input
                  ref={numberRef}
                  id="barcode-number"
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder="Type the barcode number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                  className="field h-12 pl-10 font-mono text-[0.9375rem] placeholder:font-sans"
                />
              </div>
              <Button type="submit" className="h-12" disabled={!number.trim()}>
                Look up
              </Button>
            </form>
          </div>

          {isProfileEmpty(profile) && (
            <button
              type="button"
              onClick={() => router.push('/settings#profile')}
              className="mt-8 flex w-full items-center justify-between gap-4 rounded-xl border border-dashed border-ink/20 px-5 py-4 text-left transition-colors hover:border-ink/40 hover:bg-surface/60"
            >
              <span>
                <span className="block text-sm font-semibold">Vegetarian? Avoiding nuts?</span>
                <span className="mt-0.5 block text-sm text-ink-2">Add your food profile and every scan warns you.</span>
              </span>
              <span className="text-sm font-medium text-accent-ink">Set up</span>
            </button>
          )}
        </section>

        <RecentScans items={recent} onOpen={onOpen} />
      </div>

      {camera && (
        <CameraScanner
          onDetected={(c) => {
            setCamera(false)
            onOpen(c)
          }}
          onClose={() => setCamera(false)}
          onTypeInstead={() => {
            setCamera(false)
            requestAnimationFrame(() => numberRef.current?.focus())
          }}
        />
      )}
    </div>
  )
}

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
