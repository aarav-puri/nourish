'use client'

import { useState } from 'react'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { getGeminiApiKey, setGeminiApiKey } from '@/lib/ai-service'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

/**
 * Checks a Gemini key against Google before saving it, so a typo is caught
 * here rather than as a failed scan later.
 */
export async function verifyGeminiKey(key: string): Promise<'ok' | 'invalid' | 'unreachable'> {
  try {
    const res = await fetch('/api/ai/verify', { method: 'POST', headers: { 'x-gemini-api-key': key } })
    const body = await res.json()
    return body.status === 'ok' || body.status === 'invalid' ? body.status : 'unreachable'
  } catch {
    return 'unreachable'
  }
}

export default function KeySetup({ onSaved, submitLabel = 'Save key' }: { onSaved?: (key: string) => void; submitLabel?: string }) {
  const [value, setValue] = useState(() => getGeminiApiKey())
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const key = value.trim()
    setError('')
    if (!key) {
      setError('Paste your Gemini API key.')
      return
    }
    setBusy(true)
    const result = await verifyGeminiKey(key)
    setBusy(false)
    if (result === 'invalid') {
      setError('Google did not accept this key. Copy it again from AI Studio.')
      return
    }
    setGeminiApiKey(key)
    if (result === 'unreachable') toast('Saved. We could not reach Google to verify it just now.')
    else toast.success('Key verified and saved')
    onSaved?.(key)
  }

  return (
    <form onSubmit={save} noValidate>
      <Input
        label="Gemini API key"
        type={show ? 'text' : 'password'}
        autoComplete="off"
        spellCheck={false}
        placeholder="AIza…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error}
        hint="Stored in this browser only. Never sent to our database."
        className="font-mono text-sm"
        trailing={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide key' : 'Show key'}
            className="btn-icon h-10 w-10"
          >
            {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        }
      />
      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
        >
          Get a free key from Google AI Studio
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <Button type="submit" loading={busy}>
          {busy ? 'Checking' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
