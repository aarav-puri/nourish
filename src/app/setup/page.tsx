'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { SessionEndedError, useAuth } from '@/lib/auth-context'
import { getGeminiApiKey } from '@/lib/ai-service'
import { allergenLabel } from '@/lib/food'
import { dietLabel } from '@/lib/profile'
import Wordmark from '@/components/brand/Wordmark'
import KeySetup from '@/components/app/KeySetup'
import { AllergenPicker, DietPicker } from '@/components/app/ProfileFields'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

const STEPS = ['name', 'diets', 'avoid', 'key', 'done'] as const
type Step = (typeof STEPS)[number]

export default function SetupPage() {
  return (
    <Suspense fallback={null}>
      <Setup />
    </Suspense>
  )
}

/**
 * First-run onboarding, straight after sign up: one question per screen,
 * then the Gemini key, then a summary before the first scan.
 */
function Setup() {
  const { user, loading, profile, saveProfile, requireSignIn } = useAuth()
  const router = useRouter()
  const next = useSearchParams().get('next') || '/app'
  const reduce = useReducedMotion()

  const [step, setStep] = useState<Step>('name')
  const [direction, setDirection] = useState(1)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [diets, setDiets] = useState<string[]>([])
  const [avoid, setAvoid] = useState<string[]>([])
  const [seeded, setSeeded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!loading && !user) requireSignIn({ next: '/setup' })
  }, [loading, user, requireSignIn])

  // Start from whatever is already saved to the account, once.
  useEffect(() => {
    if (!user || seeded) return
    setName(user.user_metadata?.display_name || user.user_metadata?.full_name || '')
    setDiets(profile.diets)
    setAvoid(profile.avoid)
    setHasKey(Boolean(getGeminiApiKey()))
    setSeeded(true)
  }, [user, profile, seeded])

  // Each new question takes focus, so screen readers announce it; the name
  // step goes straight to its field instead.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (step === 'name') document.getElementById('setup-name')?.focus({ preventScroll: true })
    else headingRef.current?.focus({ preventScroll: true })
  }, [step])

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="h-6 w-6" label="Loading" />
      </div>
    )
  }

  const index = STEPS.indexOf(step)
  const go = (to: Step) => {
    setDirection(STEPS.indexOf(to) > index ? 1 : -1)
    setStep(to)
  }

  const submitName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Enter your name.')
      return
    }
    setNameError('')
    go('diets')
  }

  // Saved before the key step, so the profile is kept even if they stop there.
  const saveAndContinue = async () => {
    setSaving(true)
    try {
      await saveProfile({ diets, avoid }, name)
    } catch (err) {
      toast.error(err instanceof SessionEndedError ? err.message : 'Could not save your profile. Try again.')
      setSaving(false)
      return
    }
    setSaving(false)
    go(hasKey ? 'done' : 'key')
  }

  const firstName = name.trim().split(/\s+/)[0]
  const slide = reduce ? 0 : 28

  return (
    <div className="nourish-app flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-[var(--gutter)]">
        <Link href="/" aria-label="Nourish home" className="rounded-md">
          <Wordmark />
        </Link>
        {step !== 'done' && (
          <p className="text-sm text-ink-3" aria-live="polite">
            Step {index + 1} of {STEPS.length - 1}
          </p>
        )}
      </header>

      <div className="mx-auto w-full max-w-3xl px-[var(--gutter)]">
        <div className="flex gap-1.5" role="progressbar" aria-label="Onboarding progress" aria-valuemin={0} aria-valuemax={STEPS.length - 1} aria-valuenow={index}>
          {STEPS.slice(0, -1).map((s, i) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
              <span
                className="block h-full rounded-full bg-accent transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `scaleX(${i < index || step === 'done' ? 1 : i === index ? 0.5 : 0})`, transformOrigin: 'left' }}
              />
            </span>
          ))}
        </div>
      </div>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-[var(--gutter)] pb-32 pt-10 sm:flex-none sm:pb-10 sm:pt-14">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={step}
            aria-labelledby="setup-h"
            initial={{ opacity: 0, x: slide * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide * direction }}
            transition={{ duration: reduce ? 0.12 : 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            {step === 'name' && (
              <form id="name-form" onSubmit={submitName} noValidate>
                <Question eyebrow="Welcome to Nourish" title={<>What should we <em>call</em> you?</>} headingRef={headingRef} />
                <label htmlFor="setup-name" className="sr-only">
                  Your name
                </label>
                <input
                  id="setup-name"
                  autoComplete="given-name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameError('')
                  }}
                  placeholder="Your name"
                  aria-invalid={nameError ? true : undefined}
                  aria-describedby={nameError ? 'setup-name-error' : undefined}
                  className="mt-8 w-full border-0 border-b-2 border-line rounded-none bg-transparent pb-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em] text-ink outline-none transition-colors placeholder:text-ink-3/60 focus:border-accent focus-visible:rounded-none focus-visible:outline-none aria-[invalid=true]:border-level-high"
                />
                {nameError && (
                  <p id="setup-name-error" role="alert" className="mt-2 text-sm font-medium text-level-high">
                    {nameError}
                  </p>
                )}
              </form>
            )}

            {step === 'diets' && (
              <>
                <Question eyebrow="Your diet" title={<>Do you follow any <em>diets</em>?</>} headingRef={headingRef} />
                <div className="mt-8">
                  <DietPicker value={diets} onChange={setDiets} />
                </div>
              </>
            )}

            {step === 'avoid' && (
              <>
                <Question eyebrow="Allergies" title={<>Anything you need to <em>avoid</em>?</>} headingRef={headingRef} />
                <div className="mt-8">
                  <AllergenPicker value={avoid} onChange={setAvoid} />
                </div>
              </>
            )}

            {step === 'key' && (
              <>
                <Question eyebrow="AI insights" title={<>Connect <em>Gemini</em></>} headingRef={headingRef} />
                <div className="card mt-8 p-5 sm:p-6">
                  <KeySetup
                    submitLabel="Verify and continue"
                    onSaved={() => {
                      setHasKey(true)
                      go('done')
                    }}
                  />
                </div>
              </>
            )}

            {step === 'done' && (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent animate-rise" aria-hidden="true">
                  <Check className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <h1 id="setup-h" ref={headingRef} tabIndex={-1} className="t-title app-editorial-title mt-6 focus-visible:outline-none">
                  You&rsquo;re all set{firstName ? <>, <em>{firstName}</em></> : null}.
                </h1>
                <dl className="card mt-8 divide-y divide-line">
                  <Summary term="Diets" items={diets.map(dietLabel)} empty="None" onEdit={() => go('diets')} />
                  <Summary term="Avoiding" items={avoid.map(allergenLabel)} empty="Nothing" onEdit={() => go('avoid')} />
                </dl>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      {/* The actions stay in reach of a thumb on phones. */}
      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/90 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-[var(--gutter)] py-3 sm:pb-12 sm:pt-0">
          {index > 0 && step !== 'done' ? (
            <Button variant="ghost" onClick={() => go(STEPS[index - 1])} icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
              Back
            </Button>
          ) : (
            <span />
          )}

          {step === 'name' && (
            <Button size="lg" type="submit" form="name-form">
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {step === 'diets' && (
            <Button size="lg" variant={diets.length ? 'primary' : 'secondary'} onClick={() => go('avoid')}>
              {diets.length ? 'Continue' : 'None for me'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {step === 'avoid' && (
            <Button size="lg" variant={avoid.length ? 'primary' : 'secondary'} loading={saving} onClick={saveAndContinue}>
              {avoid.length ? 'Continue' : 'Nothing to avoid'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {step === 'done' && (
            <Button size="lg" className="w-full sm:w-auto" onClick={() => router.replace(next)}>
              Start scanning
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

function Question({
  eyebrow,
  title,
  children,
  headingRef,
}: {
  eyebrow: string
  title: React.ReactNode
  children?: React.ReactNode
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    <>
      <p className="t-eyebrow">{eyebrow}</p>
      <h1 id="setup-h" ref={headingRef} tabIndex={-1} className="t-title app-editorial-title mt-3 focus-visible:outline-none">
        {title}
      </h1>
      {children && <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">{children}</p>}
    </>
  )
}

function Summary({ term, items, empty, onEdit }: { term: string; items: string[]; empty: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">{term}</dt>
        <dd className="mt-2 flex flex-wrap gap-1.5">
          {items.length ? (
            items.map((label) => (
              <span key={label} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-ink">
                {label}
              </span>
            ))
          ) : (
            <span className="text-[0.9375rem] text-ink-2">{empty}</span>
          )}
        </dd>
      </div>
      <button type="button" onClick={onEdit} className="btn-ghost min-h-9 shrink-0 px-3 text-xs">
        Edit
      </button>
    </div>
  )
}
