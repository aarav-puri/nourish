/** The Nourish initial opening into a leaf, on a rounded-square tile. */
export default function BrandMark({ className = '', tile = false, size = 64 }: { className?: string; tile?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {tile && <rect width="64" height="64" rx="14" fill="#2d5f46" />}
      <path
        transform={tile ? 'translate(32 32) scale(0.78) translate(-34 -30)' : undefined}
        d="M17 47V32C17 20 39 20 39 32V47M39 28C39 17 48 13 51 13C51 23 46 29 39 28Z"
        stroke={tile ? '#e4eedc' : 'currentColor'}
        strokeWidth={tile ? 5 : 4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
