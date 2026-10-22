'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import AuthShell from '@/components/auth/AuthShell'
import GoogleButton, { GOOGLE_ENABLED } from '@/components/auth/GoogleButton'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'
import Spinner from '@/components/ui/Spinner'

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const next = params.get('next') || '/app'
  const reason = params.get('reason')

  // Already signed in: this page has nothing to do.
  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [loading, user, next, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Enter your email address and password.')
      return
    }

    setBusy(true)
    try {
      await auth.signIn(email.trim(), password)
      toast.success('Signed in')
      router.replace(next)
    } catch (err) {
      const message =
        err instanceof Error && /invalid login/i.test(err.message)
          ? 'Incorrect email or password.'
          : err instanceof Error
            ? err.message
            : 'Sign in failed. Please try again.'
      setError(message)
      setBusy(false)
    }
  }

  // Send focus to the error so it is announced and reachable after a failure.
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      lede={
        reason === 'save'
          ? 'Sign in and we\'ll keep every scan, on whatever device you pick up next.'
          : 'Your scans and your history are where you left them.'
      }
      footer={
        <>
          New here?{' '}
          <Link
            href={`/signup${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="mt-8">
        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="mb-5 rounded-lg border border-level-high/30 bg-level-high/5 px-4 py-3 text-sm leading-relaxed text-ink focus:outline-none"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <div>
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-7 w-full" aria-busy={busy || undefined}>
          {busy && <Spinner />}
          {busy ? 'Signing in' : 'Sign in'}
        </button>
      </form>

      {GOOGLE_ENABLED && (
        <>
          <div className="my-6 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-2xs uppercase tracking-wide text-ink-3">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <GoogleButton label="Continue with Google" />
        </>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-3">
        By signing in you agree to our{' '}
        <Link href="/terms" className="text-ink-2 underline decoration-ink/30 underline-offset-4 hover:text-ink">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-ink-2 underline decoration-ink/30 underline-offset-4 hover:text-ink">
          Privacy Policy
        </Link>
      </p>
    </AuthShell>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner className="h-5 w-5 text-ink-3" label="Loading" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
