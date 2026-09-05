'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, KeyRound, ExternalLink, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getGeminiApiKey, setGeminiApiKey } from '@/lib/ai-service'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, loading, requireSignIn } = useAuth()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setApiKeyInput(getGeminiApiKey())
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      requireSignIn({ next: '/settings' })
    }
  }, [loading, user])

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim()
    setSaving(true)
    setGeminiApiKey(trimmed)
    toast.success(trimmed ? 'BYOK key saved' : 'BYOK key removed')
    setSaving(false)
  }

  if (loading || !user) {
    return (
      <div className="min-h-dvh bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/app" className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-xl font-bold gradient-text">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main id="main" className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* BYOK */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-400">BYOK (Bring Your Own Key)</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            AI insights run on your own key, so usage is billed directly by the provider.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-3">
            <Input
              label="API Key"
              type="password"
              autoComplete="off"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste your key"
              hint="Stored in this browser only. Leave empty to remove it."
              className="flex-1 min-w-0"
            />
            <Button onClick={handleSaveApiKey} loading={saving} className="sm:mb-8">
              Save
            </Button>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 min-h-11 text-xs text-zinc-400 hover:text-white underline"
          >
            Get your key at Google AI Studio
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </section>
      </main>
    </div>
  )
}
