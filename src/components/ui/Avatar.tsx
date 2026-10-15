import Image from 'next/image'

/** The account's picture, or its initial on a tinted disc. */
export default function Avatar({ user, size = 32 }: { user: any; size?: number }) {
  const url: string | undefined = user?.user_metadata?.avatar_url
  const initial = (user?.email?.[0] ?? '?').toUpperCase()
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft font-medium text-accent-ink"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {url ? <Image src={url} alt="" width={size} height={size} className="h-full w-full object-cover" /> : initial}
    </span>
  )
}
