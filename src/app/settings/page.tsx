'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/supabase'
import { getGeminiApiKey, maskKey, setGeminiApiKey } from '@/lib/ai-service'
import { type DietId } from '@/lib/profile'
import AppShell from '@/components/app/AppShell'
import KeySetup from '@/components/app/KeySetup'
import ProfileFields from '@/components/app/ProfileFields'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function SettingsPage() {
  return (
    <AppShell>
      <Settings />
    </AppShell>
  )
}

function Settings() {
  // The shell renders this only once the session has loaded, so the hash
  // target exists now; the browser's own jump happened before it did.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <div>
      <h1 className="t-title">Settings</h1>
      <div className="mt-8 space-y-10">
        <AccountSection />
        <FoodProfileSection />
        <KeySection />
      </div>
    </div>
  )
}

function Section({ id, title, description, children }: { id?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-h`} className="scroll-mt-24">
      <h2 id={`${id ?? title}-h`} className="t-heading">
        {title}
      </h2>
      {description && <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/* ---------- Food profile ------------------------------------------ */

function FoodProfileSection() {
  const { profile, saveProfile } = useAuth()
  const [diets, setDiets] = useState<DietId[]>(profile.diets)
  const [avoid, setAvoid] = useState<string[]>(profile.avoid)
  const [saving, setSaving] = useState(false)

  const dirty =
    [...diets].sort().join() !== [...profile.diets].sort().join() ||
    [...avoid].sort().join() !== [...profile.avoid].sort().join()

  const save = async () => {
    setSaving(true)
    try {
      await saveProfile({ diets, avoid })
      toast.success('Food profile saved', { description: 'Every scan now checks against it.' })
    } catch {
      toast.error('Could not save your profile. Try again.')
    }
    setSaving(false)
  }

  return (
    <Section id="profile" title="Food profile">
      <div className="card p-5 sm:p-6">
        <ProfileFields diets={diets} avoid={avoid} onDiets={setDiets} onAvoid={setAvoid} />

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-4">
          <p className="text-xs text-ink-3" aria-live="polite">
            {dirty ? 'Unsaved changes' : ''}
          </p>
          <Button onClick={save} loading={saving} disabled={!dirty}>
            Save profile
          </Button>
        </div>
      </div>
    </Section>
  )
}

/* ---------- Gemini key -------------------------------------------- */

function KeySection() {
  const [key, setKey] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => setKey(getGeminiApiKey()), [])

  return (
    <Section id="key" title="Gemini API key">
      <div className="card p-5 sm:p-6">
        {key && !editing ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-level-low/10 text-level-low">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">Key connected</p>
                <p className="truncate font-mono text-xs text-ink-3">{maskKey(key)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGeminiApiKey('')
                  setKey('')
                  toast('Key removed from this browser')
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <>
            <KeySetup
              onSaved={(k) => {
                setKey(k)
                setEditing(false)
              }}
            />
            {editing && (
              <button type="button" onClick={() => setEditing(false)} className="mt-2 text-sm text-ink-3 hover:text-ink">
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </Section>
  )
}

/* ---------- Account ----------------------------------------------- */

function AccountSection() {
  const router = useRouter()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) return toast.error('Use a JPG, PNG, WebP or GIF image.')
    if (file.size > MAX_AVATAR_BYTES) return toast.error('Images must be under 5MB.')
    setAvatarBusy(true)
    try {
      await auth.uploadAvatar(file)
      toast.success('Photo updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload that image.')
    }
    setAvatarBusy(false)
  }

  const removeAvatar = async () => {
    setAvatarBusy(true)
    try {
      await auth.removeAvatar()
      toast.success('Photo removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove the photo.')
    }
    setAvatarBusy(false)
  }

  const sendReset = async () => {
    setResetBusy(true)
    try {
      await auth.resetPassword(user.email)
      toast.success('Check your inbox', { description: `We sent a link to ${user.email} to set a new password.` })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the email.')
    }
    setResetBusy(false)
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      await auth.deleteAccount()
      toast.success('Your account has been deleted')
      router.replace('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete the account.')
      setDeleting(false)
    }
  }

  const confirmed = confirmText.trim().toLowerCase() === user?.email?.toLowerCase()

  return (
    <Section id="account" title="Account">
      <div className="card divide-y divide-line overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar user={user} size={48} />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.email}</p>
              <p className="text-xs text-ink-3">
                Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept={ALLOWED_AVATAR_TYPES.join(',')} onChange={onAvatar} className="sr-only" tabIndex={-1} aria-hidden="true" />
            <Button variant="secondary" size="sm" loading={avatarBusy} onClick={() => fileRef.current?.click()}>
              {user.user_metadata?.avatar_url ? 'Change photo' : 'Add photo'}
            </Button>
            {user.user_metadata?.avatar_url && (
              <Button variant="ghost" size="sm" disabled={avatarBusy} onClick={removeAvatar}>
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-6">
          <p className="text-sm font-medium">Password</p>
          <Button variant="secondary" size="sm" loading={resetBusy} onClick={sendReset}>
            Send reset link
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-6">
          <p className="text-sm font-medium text-level-high">Delete account</p>
          <Button variant="secondary" size="sm" className="text-level-high" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </div>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setConfirmText('')
        }}
        title="Delete your account?"
        description="This permanently removes your account, scan history, food profile and saved AI answers."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteOpen(false)
                setConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" disabled={!confirmed} loading={deleting} onClick={deleteAccount}>
              Delete forever
            </Button>
          </div>
        }
      >
        <Input
          label="Type your email to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={user.email}
        />
      </Modal>
    </Section>
  )
}
