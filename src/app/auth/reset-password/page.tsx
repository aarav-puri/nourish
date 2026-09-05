'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import { auth, supabase } from '@/lib/supabase'
import AuthShell from '@/components/auth/AuthShell'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

type Stage = 'checking' | 'ready' | 'invalid'

/**
 * Where the emailed reset link lands. Supabase puts the recovery credential in
 * the URL: a `code` to exchange under PKCE, or tokens in the hash under the
 * implicit flow, which the client picks up itself via detectSessionInUrl. We
 * cover both, then let the user set the new password against that session.
 */
export default function ResetPasswordLandingPage() {
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    let cancelled = false

    // A recovery session arriving from the hash is reported here rather than
    // being ready at first paint, so listen before we look.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setStage('ready')
      }
    })

    const run = async () => {
      const query = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

      // An expired or already used link comes back as an error, not a session.
      const linkError = query.get('error_description') || hash.get('error_description')
      if (linkError) {
        if (!cancelled) setStage('invalid')
        return
      }

      const code = query.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!cancelled) setStage(exchangeError ? 'invalid' : 'ready')
        return
      }

      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) {
        setStage('ready')
        return
      }

      // The hash may still be in flight. Give the client a beat before giving up.
      setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession()
        if (!cancelled) setStage(retry.session ? 'ready' : 'invalid')
      }, 1200)
    }

    run()

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // Keep the credential out of the address bar and out of the back button.
  useEffect(() => {
    if (stage === 'ready' && (window.location.hash || window.location.search)) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [stage])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Those two passwords do not match.')
      return
    }

    setBusy(true)
    try {
      await auth.updatePassword(password)
      toast.success('Password updated')
      router.replace('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not update your password. Please try again.')
      setBusy(false)
    }
  }

  if (stage === 'checking') {
    return (
      <AuthShell
        eyebrow="Reset password"
        title="One moment"
        lede="Checking your reset link."
        footer={
          <Link href="/signin" className="font-medium text-white underline underline-offset-4 hover:text-zinc-300">
            Back to sign in
          </Link>
        }
      >
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Verifying
        </div>
      </AuthShell>
    )
  }

  if (stage === 'invalid') {
    return (
      <AuthShell
        eyebrow="Reset password"
        title="That link has expired"
        lede="Reset links are single use and time limited. Ask for a fresh one and it will work."
        footer={
          <Link href="/signin" className="font-medium text-white underline underline-offset-4 hover:text-zinc-300">
            Back to sign in
          </Link>
        }
      >
        <div className="mt-8 flex items-center gap-4 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-4">
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-zinc-300">
            If you opened the link in a different browser than you requested it from, ask for a new one here.
          </p>
        </div>

        <Link href="/signin/reset" className="btn-primary mt-7 w-full">
          Send a new link
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Set a new password"
      lede="Pick something you have not used here before. You will be signed in once it is saved."
      footer={
        <Link href="/signin" className="font-medium text-white underline underline-offset-4 hover:text-zinc-300">
          Back to sign in
        </Link>
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

        <div className="space-y-5">
          <Input
            label="New password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            hint="At least 8 characters."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your new password"
          />

          <Input
            label="Confirm new password"
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
          {busy ? 'Saving' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  )
}
