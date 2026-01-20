import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-dark-card border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <a 
              href="mailto:barcodesenseofficial@gmail.com" 
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} BarcodeSense. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
