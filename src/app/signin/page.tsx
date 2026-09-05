'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { auth } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import AuthShell from '@/components/auth/AuthShell'
import GoogleButton from '@/components/auth/GoogleButton'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

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
            className="font-medium text-white underline underline-offset-4 hover:text-zinc-300"
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
            className="mb-5 rounded-xl border border-white/25 bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white focus:outline-none"
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
            <div className="mt-2 text-right">
              <Link
                href="/signin/reset"
                className="text-xs text-zinc-400 underline underline-offset-4 hover:text-white"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-7 w-full" aria-busy={busy || undefined}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Signing in' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-bold uppercase tracking-label text-zinc-600">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton label="Continue with Google" />

      <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
        By signing in you agree to our{' '}
        <Link href="/terms" className="text-zinc-300 underline underline-offset-4 hover:text-white">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-zinc-300 underline underline-offset-4 hover:text-white">
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
        <div className="flex min-h-dvh items-center justify-center bg-black">
          <span className="spinner" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
