'use client'

import { forwardRef, InputHTMLAttributes, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Persistent guidance below the field - survives typing, unlike a placeholder. */
  hint?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, icon, id, required, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    // Wire hint and error to the field so a screen reader hears both with the label.
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-xs font-semibold text-zinc-300">
            {label}
            {required && (
              <span className="ml-1 text-zinc-500" aria-hidden="true">
                *
              </span>
            )}
            {required && <span className="sr-only"> (required)</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            className={`
              min-h-11 w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-[0.95rem] text-white
              placeholder:text-zinc-500 focus:outline-none focus:ring-2
              transition-[border-color,box-shadow,background-color] duration-[120ms]
              ${icon ? 'pl-12' : ''}
              ${
                error
                  ? 'border-white/50 focus:border-white focus:ring-white/25'
                  : 'border-white/12 focus:border-white/50 focus:bg-white/[0.06] focus:ring-white/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-2 text-xs leading-relaxed text-zinc-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-2 text-xs font-medium leading-relaxed text-white">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
