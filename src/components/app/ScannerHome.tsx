'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { Camera, ImageUp, Leaf, Search, Keyboard } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { decodeImage, isValidGtin } from '@/lib/barcode'
import { isProfileEmpty } from '@/lib/profile'
import CameraLauncher from '@/components/app/CameraLauncher'
import CameraScanner from '@/components/app/CameraScanner'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function ScannerHome({ onOpen }: { onOpen: (code: string) => void }) {
  const router = useRouter()
  const { profile, user } = useAuth()
  const [method, setMethod] = useState<'camera' | 'upload' | 'manual'>('camera')
  const [camera, setCamera] = useState(false)
  const [number, setNumber] = useState('')
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const numberRef = useRef<HTMLInputElement>(null)
  const reduce = useReducedMotion()
  // The tab panels differ in height; measure the open one so the card eases between them.
  const panelsRef = useRef<HTMLDivElement>(null)
  const [panelsHeight, setPanelsHeight] = useState<number>()

  useEffect(() => {
    const el = panelsRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setPanelsHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const readPhoto = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('That is not an image. Use a photo of the barcode.')
        return
      }
      setMethod('upload')
      setReading(true)
      try {
        const code = await decodeImage(file)
        if (code) onOpen(code)
        else
          toast.error('No barcode found in that photo', {
            description: 'Get closer, keep it flat and in focus, or type the number.',
          })
      } catch {
        toast.error('Could not read that image.')
      } finally {
        setReading(false)
      }
    },
    [onOpen]
  )

  // Paste a screenshot or photo anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((i) => i.type.startsWith('image/'))
        ?.getAsFile()
      if (file) {
        e.preventDefault()
        readPhoto(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [readPhoto])

  const submitNumber = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = number.replace(/\D/g, '')
    if (!clean) {
      numberRef.current?.focus()
      return
    }
    if ([8, 12, 13].includes(clean.length) && !isValidGtin(clean)) {
      toast('That check digit looks off', { description: 'Looking it up anyway. Double-check the last digit if nothing comes back.' })
    }
    onOpen(clean)
  }

  return (
    <div
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault()
          setDragging(true)
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
        if (file) readPhoto(file)
      }}
      className="relative"
    >
      <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 id="scan-h" className="t-title app-editorial-title"><em>Scan your food.</em></h1>
        {user?.user_metadata?.display_name && <p className="mt-3 text-sm text-ink-2">Ready, {user.user_metadata.display_name}?</p>}
      </div>
      <section aria-labelledby="scan-h" className="scanner-workspace">
        <div role="tablist" aria-label="Scan method" className="scan-switch">
          {([{id:'camera',label:'Camera',icon:Camera},{id:'upload',label:'Upload photo',icon:ImageUp},{id:'manual',label:'Enter manually',icon:Keyboard}] as const).map((item,index,items) => (
            <button key={item.id} id={`tab-${item.id}`} role="tab" type="button" aria-selected={method === item.id} aria-controls={`panel-${item.id}`} tabIndex={method === item.id ? 0 : -1}
              onClick={() => setMethod(item.id)}
              onKeyDown={(e) => {
                const target = e.key === 'ArrowRight' ? (index + 1) % 3 : e.key === 'ArrowLeft' ? (index + 2) % 3 : e.key === 'Home' ? 0 : e.key === 'End' ? 2 : -1
                if (target < 0) return
                e.preventDefault(); setMethod(items[target].id)
                document.getElementById(`tab-${items[target].id}`)?.focus()
              }}>
              {method === item.id && (
                <motion.span layoutId="scan-tab" aria-hidden="true" className="scan-switch-pill" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <item.icon className="relative h-4 w-4" aria-hidden="true" /><span className="relative">{item.label}</span>
            </button>
          ))}
        </div>
        <motion.div animate={{ height: panelsHeight ?? 'auto' }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 36 }} className="overflow-hidden">
          <div ref={panelsRef}>
          <div id="panel-camera" role="tabpanel" aria-labelledby="tab-camera" hidden={method !== 'camera'} tabIndex={-1} className="scan-panel scan-panel-flush">
            <CameraLauncher onOpen={() => setCamera(true)} />
          </div>
          <div id="panel-upload" role="tabpanel" aria-labelledby="tab-upload" hidden={method !== 'upload'} tabIndex={0} className="scan-panel">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={reading} className={`scan-upload ${dragging ? 'is-dragging' : ''}`}>
              {reading ? <Spinner className="h-8 w-8" /> : <ImageUp className="h-9 w-9 text-accent-ink" aria-hidden="true" />}
              <span className="font-medium">{reading ? 'Reading barcode…' : dragging ? 'Drop your photo here' : 'Choose a barcode photo'}</span>
              <span className="text-sm text-ink-2">Or drag and drop, or paste an image</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Barcode photo" onChange={(e) => { const f=e.target.files?.[0]; e.target.value=''; if(f) readPhoto(f) }} />
            <p role="status" className="sr-only">{reading ? 'Reading barcode from your photo' : ''}</p>
          </div>
          <div id="panel-manual" role="tabpanel" aria-labelledby="tab-manual" hidden={method !== 'manual'} tabIndex={0} className="scan-panel">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft text-accent-ink"><Keyboard className="h-7 w-7" aria-hidden="true" /></div>
            <form onSubmit={submitNumber} className="text-left" role="search" aria-label="Look up a barcode number">
              <label htmlFor="barcode-number" className="mb-2 block text-sm font-medium">Barcode number</label>
              <input ref={numberRef} id="barcode-number" inputMode="numeric" autoComplete="off" enterKeyHint="search" placeholder="e.g. 3017620422003" value={number} onChange={(e) => setNumber(e.target.value.replace(/[^\d\s]/g, ''))} className="field h-14 font-mono text-base tracking-wider" />
              <Button type="submit" className="mt-5 h-12 w-full" disabled={!number.trim()}><Search className="h-4 w-4" aria-hidden="true" />Look up product</Button>
            </form>
          </div>
          </div>
        </motion.div>
      </section>
          {isProfileEmpty(profile) && (
            <button
              type="button"
              onClick={() => router.push('/settings#profile')}
              className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4 text-left transition-colors hover:border-accent/30 hover:bg-accent-soft/30"
            >
              <span>
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-ink"><Leaf className="h-4 w-4" aria-hidden="true" /></span><span className="block text-sm font-semibold">Food profile</span>
              </span>
              <span className="text-sm font-medium text-accent-ink">Set up</span>
            </button>
          )}
      </div>

      {camera && (
        <CameraScanner
          onDetected={(c) => {
            setCamera(false)
            onOpen(c)
          }}
          onClose={() => setCamera(false)}
          onTypeInstead={() => {
            setCamera(false)
            setMethod('manual')
            requestAnimationFrame(() => numberRef.current?.focus())
          }}
        />
      )}
    </div>
  )
}

