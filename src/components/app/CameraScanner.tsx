'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CameraOff, Flashlight, FlashlightOff, Keyboard, X } from 'lucide-react'
import { QUAGGA_READERS, getNativeDetector, isValidGtin, normalizeCode } from '@/lib/barcode'
import Spinner from '@/components/ui/Spinner'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
  /** Switch to typing the number, for codes the camera will not read. */
  onTypeInstead: () => void
}

type Phase = 'starting' | 'scanning' | 'denied' | 'unavailable'

/**
 * A full-screen viewfinder. Reads continuously and hands back the first code
 * that passes its check digit, confirmed across consecutive frames so a
 * half-read code never triggers a lookup.
 */
export default function CameraScanner({ onDetected, onClose, onTypeInstead }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const quaggaTargetRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const quaggaRef = useRef<any>(null)
  const doneRef = useRef(false)
  const lastRef = useRef<{ code: string; hits: number }>({ code: '', hits: 0 })
  const [phase, setPhase] = useState<Phase>('starting')
  const [engine, setEngine] = useState<'native' | 'quagga' | null>(null)
  const [torch, setTorch] = useState<{ supported: boolean; on: boolean }>({ supported: false, on: false })

  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  /** Accept a read only once it has been seen in `need` frames running. */
  const consider = useCallback((raw: string, need: number) => {
    if (doneRef.current) return
    const code = normalizeCode(raw)
    if (!isValidGtin(code)) return
    const last = lastRef.current
    last.hits = last.code === code ? last.hits + 1 : 1
    last.code = code
    if (last.hits >= need) {
      doneRef.current = true
      navigator.vibrate?.(35)
      onDetectedRef.current(code)
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (quaggaRef.current) {
      try {
        quaggaRef.current.offDetected()
        quaggaRef.current.stop()
      } catch {
        /* already stopped */
      }
      quaggaRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let raf = 0

    const fail = (err: any) => {
      if (cancelled) return
      const name = err?.name || ''
      setPhase(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable')
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) return fail({ name: 'NotSupported' })

      const native = await getNativeDetector()
      if (cancelled) return

      if (native) {
        setEngine('native')
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false,
          })
          if (cancelled) return stream.getTracks().forEach((t) => t.stop())
          streamRef.current = stream
          const video = videoRef.current!
          video.srcObject = stream
          await video.play()
          detectTorch(stream.getVideoTracks()[0])
          setPhase('scanning')

          let last = 0
          const tick = async (t: number) => {
            if (cancelled || doneRef.current) return
            if (t - last > 120 && video.readyState >= 2) {
              last = t
              try {
                const results = await native.detect(video)
                for (const r of results) consider(r.rawValue, 2)
              } catch {
                /* a dropped frame */
              }
            }
            raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        } catch (err) {
          fail(err)
        }
        return
      }

      setEngine('quagga')
      try {
        const Quagga = (await import('quagga')).default as any
        if (cancelled) return
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: quaggaTargetRef.current,
              constraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
              area: { top: '30%', right: '8%', left: '8%', bottom: '30%' },
            },
            locator: { patchSize: 'medium', halfSample: true },
            numOfWorkers: Math.min(4, navigator.hardwareConcurrency || 2),
            frequency: 12,
            decoder: { readers: QUAGGA_READERS },
            locate: true,
          },
          (err: any) => {
            if (cancelled) return
            if (err) return fail(err)
            quaggaRef.current = Quagga
            Quagga.start()
            const track = Quagga.CameraAccess?.getActiveTrack?.()
            if (track) detectTorch(track)
            setPhase('scanning')
          }
        )
        Quagga.onDetected((result: any) => {
          const code = result?.codeResult?.code
          if (code) consider(code, 3)
        })
      } catch (err) {
        fail(err)
      }
    }

    const detectTorch = (track?: MediaStreamTrack) => {
      const caps = (track?.getCapabilities?.() ?? {}) as any
      if (caps.torch) setTorch({ supported: true, on: false })
    }

    start()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stop()
    }
  }, [consider, stop])

  // Escape closes; the page behind cannot scroll while the camera is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const toggleTorch = async () => {
    const track: MediaStreamTrack | undefined =
      streamRef.current?.getVideoTracks()[0] ?? quaggaRef.current?.CameraAccess?.getActiveTrack?.()
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch.on } as any] })
      setTorch((t) => ({ ...t, on: !t.on }))
    } catch {
      setTorch({ supported: false, on: false })
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan a barcode with your camera"
      className="fixed inset-0 z-[200] flex animate-fade-in flex-col bg-[#0b0b0a] text-white"
    >
      {/* Camera feed */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${engine === 'native' ? '' : 'hidden'}`}
        />
        <div
          ref={quaggaTargetRef}
          className={`h-full w-full [&_canvas]:hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover ${
            engine === 'quagga' ? '' : 'hidden'
          }`}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-md transition-colors hover:bg-black/65"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {torch.supported && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-pressed={torch.on}
            aria-label={torch.on ? 'Turn torch off' : 'Turn torch on'}
            className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
              torch.on ? 'bg-white text-black' : 'bg-black/45 hover:bg-black/65'
            }`}
          >
            {torch.on ? <Flashlight className="h-5 w-5" aria-hidden="true" /> : <FlashlightOff className="h-5 w-5" aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* Viewfinder */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        {phase === 'denied' || phase === 'unavailable' ? (
          <div className="max-w-xs text-center">
            <CameraOff className="mx-auto h-8 w-8 text-white/70" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">
              {phase === 'denied' ? 'Camera access is off' : 'No camera available'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {phase === 'denied'
                ? 'Allow camera access for this site in your browser settings, then try again. You can also type the number printed under the barcode.'
                : 'This device or browser cannot open a camera here. Type the number under the barcode, or upload a photo of it.'}
            </p>
          </div>
        ) : (
          <div className="relative aspect-[1.6] w-full max-w-sm">
            {/* Dim everything outside the frame. */}
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.5)]" aria-hidden="true" />
            {(['left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-2xl', 'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-2xl', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl'] as const).map((c) => (
              <span key={c} aria-hidden="true" className={`absolute h-8 w-8 border-white ${c}`} />
            ))}
            {phase === 'scanning' ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-4 top-1/2 h-0.5 animate-sweep rounded-full bg-white shadow-[0_0_16px_rgb(255_255_255/0.9)]"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner className="h-6 w-6" label="Starting camera" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="relative z-20 flex flex-col items-center gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {phase === 'scanning' && (
          <p className="text-center text-sm text-white/80" aria-live="polite">
            Line the barcode up inside the frame. It reads on its own.
          </p>
        )}
        <button
          type="button"
          onClick={onTypeInstead}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <Keyboard className="h-4 w-4" aria-hidden="true" />
          Type the number instead
        </button>
      </div>
    </div>,
    document.body
  )
}
