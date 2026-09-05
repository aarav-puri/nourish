'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, MailCheck } from 'lucide-react'
import { auth } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import AuthShell from '@/components/auth/AuthShell'
import GoogleButton from '@/components/auth/GoogleButton'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

const MIN_PASSWORD = 8

function SignUpForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [checkInbox, setCheckInbox] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const next = params.get('next') || '/app'

  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [loading, user, next, router])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate on submit rather than per keystroke, and name the fix.
    if (!email.trim()) {
      setError('Enter the email address you want to use.')
      return
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Your password needs at least ${MIN_PASSWORD} characters.`)
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match. Retype them and try again.')
      return
    }

    setBusy(true)
    try {
      const data = await auth.signUp(email.trim(), password)
      // Supabase returns a user with no session when confirmation is required.
      if (data?.session) {
        toast.success('Account created')
        router.replace(next)
        return
      }
      setCheckInbox(true)
      setBusy(false)
    } catch (err) {
      const message =
        err instanceof Error && /already registered|already exists/i.test(err.message)
          ? 'An account already uses that email. Sign in instead.'
          : err instanceof Error
            ? err.message
            : 'We could not create the account. Please try again.'
      setError(message)
      setBusy(false)
    }
  }

  if (checkInbox) {
    return (
      <AuthShell
        eyebrow="Almost there"
        title="Check your inbox"
        lede={`We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`}
        footer={
          <>
            Wrong address?{' '}
            <button
              type="button"
              onClick={() => setCheckInbox(false)}
              className="font-medium text-white underline underline-offset-4 hover:text-zinc-300"
            >
              Go back
            </button>
          </>
        }
      >
        <div className="mt-8 flex items-center gap-4 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-4">
          <MailCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-zinc-300">
            The link expires after a while. If nothing arrives, check your spam folder.
          </p>
        </div>

        <Link href="/signin" className="btn-secondary mt-6 w-full">
          Back to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Sign up"
      title="Let's get you started"
      lede="Free to start, with unlimited scans. Your history follows you to any device."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={`/signin${next !== '/app' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-medium text-white underline underline-offset-4 hover:text-zinc-300"
          >
            Sign in
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
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={`At least ${MIN_PASSWORD} characters.`}
            placeholder="Choose a password"
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-7 w-full" aria-busy={busy || undefined}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Creating account' : 'Create account'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-bold uppercase tracking-label text-zinc-600">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton label="Sign up with Google" />

      <p className="mt-6 text-center text-xs leading-relaxed text-zinc-500">
        By creating an account you agree to our{' '}
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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-black">
          <span className="spinner" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  )
}
