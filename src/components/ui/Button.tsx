'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

/**
 * The product's button, on the site's button. Variants resolve to the same
 * `.btn-*` classes the marketing pages use, so a control looks identical
 * wherever it appears.
 *
 * Sizing is min-height driven: this is a phone-first scanner, so 44px is the
 * floor for every control, not the 24px web minimum.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading,
      icon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger:
        'btn border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-400',
    }

    const sizes = {
      sm: 'min-h-11 px-4 text-[11px]',
      md: 'min-h-11 px-6',
      lg: 'min-h-14 px-8 text-sm',
    }

    return (
      <button
        ref={ref}
        type={type}
        className={`${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
