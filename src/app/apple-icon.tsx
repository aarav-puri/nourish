import { ImageResponse } from 'next/og'

// iOS adds its own corner rounding, so this stays full bleed with no radius
// or padding baked in.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#ffffff',
          fontSize: 108,
          fontWeight: 600,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        n.
      </div>
    ),
    { ...size }
  )
}
