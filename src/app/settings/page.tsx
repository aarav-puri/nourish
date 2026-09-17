'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, KeyRound, ExternalLink, User, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/supabase'
import { getGeminiApiKey, setGeminiApiKey } from '@/lib/ai-service'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import Orb from '@/components/ui/Orb'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, requireSignIn } = useAuth()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Use a JPG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be under 5MB.')
      return
    }

    setAvatarBusy(true)
    try {
      await auth.uploadAvatar(file)
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload image')
    }
    setAvatarBusy(false)
  }

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true)
    try {
      await auth.removeAvatar()
      toast.success('Profile picture removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove image')
    }
    setAvatarBusy(false)
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await auth.deleteAccount()
      toast.success('Account deleted')
      router.replace('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete account')
      setDeleting(false)
    }
  }

  const deleteConfirmed = deleteConfirmText.trim().toLowerCase() === user?.email?.toLowerCase()

  if (loading || !user) {
    return (
      <div className="min-h-dvh bg-dark flex items-center justify-center">
        <Orb size={64} label="Loading" />
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
        {/* Profile */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-400">Profile</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            This picture shows up next to your account across the app.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-7 w-7 text-black" aria-hidden="true" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_AVATAR_TYPES.join(',')}
                onChange={handleAvatarChange}
                className="sr-only"
                aria-label="Upload profile picture"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Upload className="h-4 w-4" aria-hidden="true" />}
                loading={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload photo
              </Button>
              {user.user_metadata?.avatar_url && (
                <Button variant="ghost" size="sm" disabled={avatarBusy} onClick={handleRemoveAvatar}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">JPG, PNG, WebP, or GIF. Up to 5MB.</p>
        </section>

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

        {/* Danger zone */}
        <section className="card border-red-500/30 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-medium text-red-400">Danger zone</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Deleting your account removes your profile, scans, and AI insights. This cannot be undone.
          </p>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </section>
      </main>

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setDeleteConfirmText('')
        }}
        title="Delete your account"
      >
        <p className="text-sm leading-relaxed text-zinc-300">
          This permanently deletes your account, scans, and AI insights. It cannot be undone.
        </p>
        <div className="mt-5">
          <Input
            label={`Type "${user.email}" to confirm`}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            autoComplete="off"
            placeholder={user.email}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setDeleteOpen(false)
              setDeleteConfirmText('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!deleteConfirmed}
            loading={deleting}
            onClick={handleDeleteAccount}
          >
            Delete account
          </Button>
        </div>
      </Modal>
    </div>
  )
}
