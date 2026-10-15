'use client'

import { useEffect, useCallback, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  /** One line under the title. */
  description?: React.ReactNode
  /** Names the dialog for screen readers when no visible title is rendered. */
  label?: string
  children: React.ReactNode
  /** Pinned under the scrolling body, for the dialog's actions. */
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-2xl' }

/**
 * One dialog for the whole product. On a phone it rises as a bottom sheet
 * within thumb reach; from the small breakpoint up it is a centred panel.
 * Focus is trapped while open and returned to the opener on close.
 */
export default function Modal({ isOpen, onClose, title, description, label, children, footer, size = 'md' }: ModalProps) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // `mounted` spans the exit transition; `shown` drives the transition itself.
  const [mounted, setMounted] = useState(isOpen)
  const [shown, setShown] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCloseRef.current()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return

    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null
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
  }, [])

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      return
    }
    setShown(false)
    const t = window.setTimeout(() => setMounted(false), 220)
    return () => window.clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!mounted || !isOpen) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    document.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const raf = requestAnimationFrame(() => {
      setShown(true)
      // Focus the first field if there is one, otherwise the panel itself, so
      // a close button is never the thing a keyboard user lands on.
      const field = panelRef.current?.querySelector<HTMLElement>('input:not([type=hidden]):not([disabled]), textarea')
      ;(field ?? panelRef.current)?.focus({ preventScroll: true })
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
      restoreFocusRef.current?.focus?.({ preventScroll: true })
    }
  }, [mounted, isOpen, handleKeyDown])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-[rgb(12_12_10/0.45)] backdrop-blur-[2px] transition-opacity duration-200 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={!title ? label : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-paper shadow-neu
          transition-[opacity,transform] duration-200 ease-out focus:outline-none sm:max-h-[85dvh] sm:rounded-3xl ${SIZES[size]} ${
            shown ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-full opacity-100 sm:translate-y-2 sm:scale-[0.98] sm:opacity-0'
          }`}
      >
        {/* Grab handle: a visual cue that this is a sheet on touch screens. */}
        <span aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-ink/15 sm:hidden" />

        {title && (
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-3 sm:px-6 sm:pt-5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-ink-2">
                  {description}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="btn-icon -mr-2 -mt-1.5">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>

        {footer && (
          <div className="shrink-0 bg-paper px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
