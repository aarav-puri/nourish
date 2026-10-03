import { ImageResponse } from 'next/og'

// The browser tab icon: the same lowercase mark as the wordmark, not a
// separate symbol, so the brand says one thing everywhere.
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 16,
          color: '#ffffff',
          fontSize: 38,
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
