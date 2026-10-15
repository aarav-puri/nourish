'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { getGeminiApiKey, maskKey } from '@/lib/ai-service'
import { ALLERGENS } from '@/lib/food'
import { dietLabel, type DietId } from '@/lib/profile'
import Wordmark from '@/components/brand/Wordmark'
import KeySetup from '@/components/app/KeySetup'
import ProfileFields from '@/components/app/ProfileFields'
import SetupProgress from '@/components/app/SetupProgress'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

const STEP_LABELS = ['Account', 'Food profile', 'Gemini key', 'Review']

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <Setup />
    </Suspense>
  )
}

/**
 * First-run setup, after sign up or on a browser with no Gemini key: the
 * food profile, the key, then a review before the first scan.
 */
function Setup() {
  const { user, loading, profile, saveProfile, requireSignIn } = useAuth()
  const router = useRouter()
  const next = useSearchParams().get('next') || '/app'

  const [step, setStep] = useState(1)
  const [diets, setDiets] = useState<DietId[]>([])
  const [avoid, setAvoid] = useState<string[]>([])
  const [seeded, setSeeded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [key, setKey] = useState('')

  useEffect(() => {
    if (!loading && !user) requireSignIn({ next: '/setup' })
  }, [loading, user, requireSignIn])

  // Start from whatever is already saved to the account, once.
  useEffect(() => {
    if (!user || seeded) return
    setDiets(profile.diets)
    setAvoid(profile.avoid)
    setKey(getGeminiApiKey())
    setSeeded(true)
  }, [user, profile, seeded])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-6 w-6" label="Loading" />
      </div>
    )
  }

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    completed: i === 0 || (i === 1 && step > 1) || (i === 2 && step > 2 && Boolean(key)),
  }))

  const saveAndContinue = async () => {
    const changed =
      [...diets].sort().join() !== [...profile.diets].sort().join() ||
      [...avoid].sort().join() !== [...profile.avoid].sort().join()
    if (changed) {
      setSaving(true)
      try {
        await saveProfile({ diets, avoid })
      } catch {
        toast.error('Could not save your profile. Try again.')
        setSaving(false)
        return
      }
      setSaving(false)
    }
    setStep(2)
  }

  const avoidLabels = ALLERGENS.filter((a) => avoid.includes(a.id)).map((a) => a.label)

  return (
    <div className="min-h-dvh px-[var(--gutter)] pb-16">
      <header className="mx-auto flex h-16 max-w-5xl items-center">
        <Link href="/" aria-label="Nourish home" className="rounded-md">
          <Wordmark byline />
        </Link>
      </header>

      <main id="main" className="mx-auto mt-6 grid max-w-5xl gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <div className="lg:order-2">
          <div className="lg:sticky lg:top-8">
            <SetupProgress steps={steps} current={step} />
          </div>
        </div>

        <div className="min-w-0 lg:order-1">
          <p className="t-eyebrow">
            Step {step + 1} of {STEP_LABELS.length}
          </p>

          {step === 1 && (
            <section aria-labelledby="setup-h">
              <h1 id="setup-h" className="t-title mt-2">
                Your food profile
              </h1>
              <div className="card mt-6 p-5 sm:p-6">
                <ProfileFields diets={diets} avoid={avoid} onDiets={setDiets} onAvoid={setAvoid} />
              </div>
              <div className="mt-6 flex justify-end">
                <Button size="lg" loading={saving} onClick={saveAndContinue}>
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="setup-h">
              <h1 id="setup-h" className="t-title mt-2">
                Connect Gemini
              </h1>
              <div className="card mt-6 p-5 sm:p-6">
                <KeySetup
                  submitLabel="Verify and continue"
                  onSaved={(k) => {
                    setKey(k)
                    setStep(3)
                  }}
                />
              </div>
              <div className="mt-6">
                <Button variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
                  Back
                </Button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="setup-h">
              <h1 id="setup-h" className="t-title mt-2">
                Review
              </h1>
              <dl className="card mt-6 divide-y divide-line overflow-hidden">
                <ReviewRow
                  term="Diets"
                  value={diets.length ? diets.map(dietLabel).join(', ') : 'None'}
                  onEdit={() => setStep(1)}
                />
                <ReviewRow term="Avoids" value={avoidLabels.length ? avoidLabels.join(', ') : 'None'} onEdit={() => setStep(1)} />
                <ReviewRow term="Gemini key" value={<span className="font-mono text-sm">{maskKey(key)}</span>} onEdit={() => setStep(2)} />
              </dl>
              <div className="mt-6 flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
                  Back
                </Button>
                <Button size="lg" onClick={() => router.replace(next)}>
                  Start scanning
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function ReviewRow({ term, value, onEdit }: { term: string; value: React.ReactNode; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">{term}</dt>
        <dd className="mt-1 text-[0.9375rem] text-ink">{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="btn-ghost min-h-9 shrink-0 px-3 text-xs">
        Edit
      </button>
    </div>
  )
}
