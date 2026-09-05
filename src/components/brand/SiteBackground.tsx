/**
 * The ambient ground the whole site sits on: a vertical lift out of black,
 * two drifting starfields, one broad glow, and a grid that is masked away
 * toward the edges.
 *
 * Purely decorative, so it is hidden from assistive technology. Every layer
 * is a single composited node with no per element cost, and the drift stops
 * under a reduced motion preference via the global rule in globals.css.
 */
export default function SiteBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-black to-black" />

      <div className="absolute left-0 top-0 h-px w-px animate-[star-drift_50s_linear_infinite] stars-near opacity-70" />
      <div className="absolute left-0 top-0 h-[2px] w-[2px] animate-[star-drift_80s_linear_infinite] stars-far opacity-40" />

      <div className="absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-[130px]" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(circle_at_center,black_38%,transparent_78%)]" />
    </div>
  )
}
