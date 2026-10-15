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
          paddingTop: 25,
          background: '#3D4852',
          color: '#ffffff',
          fontSize: 108,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.04em',
        }}
      >
        n
        <div
          style={{
            width: 18,
            height: 18,
            marginLeft: 5,
            alignSelf: 'flex-end',
            marginBottom: 44,
            borderRadius: 999,
            background: '#ffffff',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
