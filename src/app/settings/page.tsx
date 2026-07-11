'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, KeyRound, LogOut, History, User, ExternalLink, Loader2 } from 'lucide-react'
import { auth } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { getGeminiApiKey, setGeminiApiKey } from '@/lib/ai-service'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, openAuthModal } = useAuth()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setApiKeyInput(getGeminiApiKey())
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      openAuthModal()
      router.push('/app')
    }
  }, [loading, user])

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim()
    setSaving(true)
    setGeminiApiKey(trimmed)
    toast.success(trimmed ? 'BYOK key saved' : 'BYOK key removed')
    setSaving(false)
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/app" className="btn-ghost flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1 className="text-xl font-bold gradient-text">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Account */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-400">Account</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-1">Signed in as</p>
          <p className="text-base font-medium truncate">{user.email}</p>
        </section>

        {/* BYOK */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-400">BYOK (Bring Your Own Key)</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            AI insights run on your own key, so usage is billed directly by the provider.
          </p>

          <label className="block text-xs text-zinc-500 mb-1.5">API Key</label>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste your key"
              className="flex-1 min-w-0 px-3 py-2 text-sm bg-dark-elevated border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <Button onClick={handleSaveApiKey} disabled={saving} size="sm">
              Save
            </Button>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Get your key at Google AI Studio
            <ExternalLink className="w-3 h-3" />
          </a>
        </section>

        {/* Other */}
        <section className="card p-2">
          <Link
            href="/history"
            className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
            Scan History
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </section>
      </main>
    </div>
  )
}
