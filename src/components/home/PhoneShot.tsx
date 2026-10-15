import Image from 'next/image'
import { Wifi } from 'lucide-react'
import reportLight from '@/assets/app-report-light.png'
import reportDark from '@/assets/app-report-dark.png'

const ALT =
  'Nourish on an iPhone showing Nutella: Nutri-Score E, high in sugar and saturated fat, ultra-processed, and flagged as not fitting a profile that avoids milk and tree nuts'

// Brushed titanium, lit from the top left like everything else on the page.
const TITANIUM = 'linear-gradient(145deg, #8b9098 0%, #4b5058 22%, #2b2f35 50%, #4b5058 78%, #8b9098 100%)'

/**
 * A real scan on an iPhone: titanium frame, side buttons, Dynamic Island,
 * status bar and home indicator. Every size is a share of the phone's width
 * (cqw), so it holds its proportions at any size it is placed.
 */
export default function PhoneShot({ className = '', decorative = false }: { className?: string; decorative?: boolean }) {
  const alt = decorative ? '' : ALT
  return (
    <div className={`relative [container-type:inline-size] ${className}`}>
      {/* Side buttons: action and volume on the left, power on the right. */}
      {[
        { side: 'left', top: '20%', h: '7%' },
        { side: 'left', top: '30%', h: '12%' },
        { side: 'left', top: '44%', h: '12%' },
        { side: 'right', top: '33%', h: '17%' },
      ].map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute w-[1.4cqw] rounded-sm"
          style={{ [b.side]: '-1cqw', top: b.top, height: b.h, background: TITANIUM }}
        />
      ))}

      {/* Frame */}
      <div className="rounded-[17cqw] p-[1.3cqw] shadow-neu-hover" style={{ background: TITANIUM }}>
        {/* Black bezel */}
        <div className="rounded-[15.8cqw] bg-black p-[3cqw]">
          {/* Screen */}
          <div className="relative overflow-hidden rounded-[12.8cqw] bg-paper">
            <StatusBar />
            <Image src={reportLight} alt={alt} sizes="19rem" placeholder="blur" className="block h-auto w-full dark:hidden" />
            <Image src={reportDark} alt={alt} sizes="19rem" placeholder="blur" className="hidden h-auto w-full dark:block" />
            {/* Home indicator, in the safe area below the app as on a real iPhone. */}
            <div aria-hidden="true" className="flex h-[8.7cqw] items-center justify-center">
              <span className="h-[1.3cqw] w-[35%] rounded-full bg-ink" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The iOS status bar around the Dynamic Island, in the screen's own theme. */
function StatusBar() {
  return (
    <div aria-hidden="true" className="relative flex h-[12cqw] items-center justify-between px-[8cqw] text-ink">
      <span className="text-[4.2cqw] font-semibold tracking-tight">9:41</span>
      <span className="absolute left-1/2 top-[3cqw] h-[8.6cqw] w-[30cqw] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-[1.4cqw]">
        {/* Signal */}
        <span className="flex items-end gap-[0.6cqw]">
          {[35, 55, 75, 100].map((h) => (
            <span key={h} className="w-[0.9cqw] rounded-[0.3cqw] bg-current" style={{ height: `${h * 0.032}cqw` }} />
          ))}
        </span>
        <Wifi className="h-[3.8cqw] w-[3.8cqw]" strokeWidth={2.6} />
        {/* Battery */}
        <span className="flex items-center gap-[0.3cqw]">
          <span className="flex h-[3.4cqw] w-[6.6cqw] items-center rounded-[1cqw] border-[0.35cqw] border-ink/40 p-[0.4cqw]">
            <span className="h-full w-[80%] rounded-[0.5cqw] bg-current" />
          </span>
          <span className="h-[1.2cqw] w-[0.45cqw] rounded-r-full bg-ink/40" />
        </span>
      </span>
    </div>
  )
}
