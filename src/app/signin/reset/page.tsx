'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, MailCheck } from 'lucide-react'
import { auth } from '@/lib/supabase'
import AuthShell from '@/components/auth/AuthShell'
import Input from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Enter the email address on your account.')
      return
    }

    setBusy(true)
    try {
      await auth.resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not send the link. Please try again.')
    }
    setBusy(false)
  }

  if (sent) {
    return (
      <AuthShell
        eyebrow="Reset password"
        title="Check your inbox"
        lede={`If an account uses ${email.trim()}, a reset link is on its way.`}
        footer={
          <Link href="/signin" className="font-medium text-white underline underline-offset-4 hover:text-zinc-300">
            Back to sign in
          </Link>
        }
      >
        <div className="mt-8 flex items-center gap-4 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-4">
          <MailCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-zinc-300">
            The link expires after a while. If nothing arrives, check your spam folder.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Reset password"
      title="It happens"
      lede="Tell us the email on your account and we'll send a link to set a new password."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/signin" className="font-medium text-white underline underline-offset-4 hover:text-zinc-300">
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

        <button type="submit" disabled={busy} className="btn-primary mt-7 w-full" aria-busy={busy || undefined}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy ? 'Sending link' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  )
}
