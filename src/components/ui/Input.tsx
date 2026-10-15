'use client'

import { forwardRef, InputHTMLAttributes, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Persistent guidance below the field. It survives typing, unlike a placeholder. */
  hint?: string
  icon?: React.ReactNode
  /** Rendered inside the field on the right, such as a show-password toggle. */
  trailing?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, icon, trailing, id, required, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const describedBy = [hint && !error ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {required && <span className="sr-only"> (required)</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            className={`field ${icon ? 'pl-10' : ''} ${trailing ? 'pr-12' : ''} ${className}`}
            {...props}
          />
          {trailing && <span className="absolute right-0 top-1/2 -translate-y-1/2">{trailing}</span>}
        </div>
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs leading-relaxed text-ink-3">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-level-high">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
