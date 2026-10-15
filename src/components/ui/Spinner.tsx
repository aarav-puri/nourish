/** A small ring that inherits the text colour of whatever it sits in. */
export default function Spinner({ className = 'h-4 w-4', label }: { className?: string; label?: string }) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-80 ${className}`}
    />
  )
}
