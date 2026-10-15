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
          paddingTop: 8,
          background: '#3D4852',
          borderRadius: 16,
          color: '#ffffff',
          fontSize: 38,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.04em',
        }}
      >
        n
        <div
          style={{
            width: 7,
            height: 7,
            marginLeft: 2,
            alignSelf: 'flex-end',
            marginBottom: 13,
            borderRadius: 999,
            background: '#ffffff',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
