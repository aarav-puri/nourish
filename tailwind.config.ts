import type { Config } from 'tailwindcss'

/**
 * Nourish design system: soft UI.
 *
 * Everything is molded from one cool grey clay. Depth comes from paired
 * shadows, light from the top left and shade to the bottom right, so
 * elements read as raised from the surface or pressed into it. Colour is
 * kept for meaning: the Nutri-Score ramp (A to E) and the traffic-light
 * nutrient levels. Actions are white, raised from the clay; the rest is
 * grey.
 *
 * Every colour is a CSS variable so the whole system flips for dark mode in
 * globals.css without a single `dark:` variant in the markup.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        surface: { DEFAULT: token('surface'), 2: token('surface-2'), 3: token('surface-3') },
        ink: { DEFAULT: token('ink'), 2: token('ink-2'), 3: token('ink-3') },
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        accent: { DEFAULT: token('accent'), ink: token('accent-ink'), soft: token('accent-soft') },
        'on-ink': token('on-ink'),
        'on-accent': token('on-accent'),
        grade: {
          a: token('grade-a'),
          b: token('grade-b'),
          c: token('grade-c'),
          d: token('grade-d'),
          e: token('grade-e'),
        },
        level: {
          low: token('level-low'),
          moderate: token('level-moderate'),
          high: token('level-high'),
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      // Soft, pillowed corners: nothing in the system is sharper than 8px.
      borderRadius: {
        DEFAULT: '8px',
        md: '12px',
        lg: '14px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '32px',
      },
      // Dual opposing shadows: light from the top left, shade to the bottom
      // right. Elements are either extruded from the surface or pressed in.
      boxShadow: {
        neu: '9px 9px 16px rgb(var(--sh-dark) / var(--sh-dark-a)), -9px -9px 16px rgb(var(--sh-light) / var(--sh-light-a))',
        'neu-hover': '12px 12px 20px rgb(var(--sh-dark) / var(--sh-dark-a-strong)), -12px -12px 20px rgb(var(--sh-light) / var(--sh-light-a-strong))',
        'neu-sm': '5px 5px 10px rgb(var(--sh-dark) / var(--sh-dark-a)), -5px -5px 10px rgb(var(--sh-light) / var(--sh-light-a))',
        'neu-inset': 'inset 6px 6px 10px rgb(var(--sh-dark) / var(--sh-dark-a)), inset -6px -6px 10px rgb(var(--sh-light) / var(--sh-light-a))',
        'neu-inset-deep': 'inset 10px 10px 20px rgb(var(--sh-dark) / var(--sh-dark-a-strong)), inset -10px -10px 20px rgb(var(--sh-light) / var(--sh-light-a-strong))',
        'neu-inset-sm': 'inset 3px 3px 6px rgb(var(--sh-dark) / var(--sh-dark-a)), inset -3px -3px 6px rgb(var(--sh-light) / var(--sh-light-a))',
        // Pressed into a white button.
        'neu-press-color': 'inset 4px 4px 8px rgb(var(--sh-dark) / 0.55), inset -4px -4px 8px rgb(255 255 255 / 0.8)',
        card: '5px 5px 10px rgb(var(--sh-dark) / var(--sh-dark-a)), -5px -5px 10px rgb(var(--sh-light) / var(--sh-light-a))',
        pop: '9px 9px 16px rgb(var(--sh-dark) / var(--sh-dark-a)), -9px -9px 16px rgb(var(--sh-light) / var(--sh-light-a))',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        sweep: {
          '0%, 100%': { transform: 'translateY(-46%)' },
          '50%': { transform: 'translateY(46%)' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        rise: 'rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        sweep: 'sweep 2.4s ease-in-out infinite',
        spin: 'spin 700ms linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
