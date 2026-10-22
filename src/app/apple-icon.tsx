import { ImageResponse } from 'next/og'
import BrandMark from '@/components/brand/BrandMark'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#2d5f46', padding: 20 }}>
      <BrandMark tile size={140} />
    </div>,
    size
  )
}
