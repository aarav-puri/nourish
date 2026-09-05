import type { Config } from 'tailwindcss'

/**
 * BarcodeSense design system.
 *
 * Noir, in strict black and white. Depth comes from layered darkness, hairline
 * white borders, blur and glow rather than from hue, so the only "accent"
 * in the system is pure white used sparingly at full strength.
 *
 * Contrast was checked for every step of the neutral ramp against the three
 * surfaces it sits on (#000000, #0A0A0A, #141414); the ratios are noted below.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#000000',
          900: '#050505',
          800: '#0A0A0A',
          700: '#141414',
          600: '#1F1F1F',
          line: '#6E6E6E', // control boundary on black, 3.4:1 and up
          muted: '#A3A3A3', // body text on black, 6.9:1 and up
        },
        paper: {
          DEFAULT: '#FFFFFF',
          2: '#F2F2F2',
          3: '#E4E4E4',
          line: '#767676',
          muted: '#5C5C5C',
        },
        // The single accent. White on the dark ground, black on the light one.
        signal: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          dim: 'rgb(var(--accent-dim-rgb) / <alpha-value>)',
        },
        'accent-on': 'rgb(var(--accent-on-rgb) / <alpha-value>)',
        alarm: { DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)' },

        // The neutral ramp the product screens already speak in.
        // 200 to 500 clear 4.5:1 for text, 600 and 700 clear 3:1 for borders.
        zinc: {
          50: '#FAFAFA',
          100: '#F2F2F2',
          200: '#D6D6D6',
          300: '#BDBDBD',
          400: '#A3A3A3',
          500: '#8F8F8F',
          600: '#7C7C7C',
          700: '#6E6E6E',
          800: '#1F1F1F',
          900: '#0A0A0A',
          950: '#000000',
        },
        // Status hues fold into greyscale. Meaning is carried by the label and
        // the fill treatment next to it, never by colour alone.
        green: { 400: '#FFFFFF', 500: '#E4E4E4', 600: '#BDBDBD' },
        emerald: { 400: '#FFFFFF', 500: '#E4E4E4', 600: '#BDBDBD' },
        red: { 400: '#FFFFFF', 500: '#D6D6D6', 600: '#BDBDBD' },
        yellow: { 400: '#BDBDBD', 500: '#A3A3A3' },
        amber: { 300: '#BDBDBD', 400: '#A3A3A3' },

        dark: { DEFAULT: '#000000', card: '#0A0A0A', elevated: '#141414' },
        control: '#6E6E6E',
      },
      borderColor: { control: '#6E6E6E' },
      fontFamily: {
        // Manrope carries the display voice, Inter the reading voice.
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        // System stack: the data voice costs no extra download.
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: { tightest: '-0.045em', label: '0.18em' },
      transitionTimingFunction: { scan: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'border-spin': {
          from: { '--gradient-angle': '0deg' },
          to: { '--gradient-angle': '360deg' },
        },
        // Two identical tracks, so half a turn is one seamless loop.
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'star-drift': {
          from: { transform: 'translateY(0px)' },
          to: { transform: 'translateY(-2000px)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        ticker: 'ticker 46s linear infinite',
        'border-spin': 'border-spin 2.5s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
export default config
