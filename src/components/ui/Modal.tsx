'use client'

import { useEffect, useCallback, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  /** Names the dialog for screen readers when no visible title is rendered. */
  label?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * The dialog is a panel clamped over the page, not a floating card: square,
 * ruled, with the signal bar across its head.
 *
 * Enter and exit run on CSS transitions rather than an animation library.
 * This dialog is mounted by the auth provider on every route, so keeping it
 * dependency-free keeps that weight off the landing page.
 */
export default function Modal({ isOpen, onClose, title, label, children, size = 'md' }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  // Mounted spans the exit transition; `shown` drives the transition itself.
  const [mounted, setMounted] = useState(isOpen)
  const [shown, setShown] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return

      // Trap Tab inside the dialog so focus can never reach the inert page.
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (items.length === 0) {
        e.preventDefault()
        panelRef.current.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      return
    }
    // Hold the node through the exit transition, then drop it.
    setShown(false)
    const t = window.setTimeout(() => setMounted(false), 200)
    return () => window.clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!mounted || !isOpen) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    const raf = requestAnimationFrame(() => {
      setShown(true)
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panelRef.current)?.focus()
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      // Return focus to whatever opened the dialog.
      restoreFocusRef.current?.focus?.()
    }
  }, [mounted, isOpen, handleKeyDown])

  if (!mounted) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-200 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? label : undefined}
        tabIndex={-1}
        className={`relative w-full ${sizes[size]} overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-zinc-900 to-black p-1 shadow-2xl shadow-black/80 transition-[opacity,transform] duration-200 ease-scan focus:outline-none motion-reduce:transition-none ${
          shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        {/* A hairline of light across the head, like a scan line at rest. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />

        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
            <h2 id={titleId} className="t-h3">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close dialog" className="btn-icon -mr-2">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="max-h-[80dvh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
