'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, History, ChevronDown } from 'lucide-react'
import { auth } from '@/lib/supabase'
import Button from '@/components/ui/Button'

interface NavbarProps {
  onAuthClick?: () => void
}

export default function Navbar({ onAuthClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    
    const { data: { subscription } } = auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleLogout = async () => {
    await auth.signOut()
    setIsUserMenuOpen(false)
  }

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
      isScrolled ? 'bg-dark/95 backdrop-blur-lg border-zinc-800' : 'bg-dark/80 backdrop-blur-sm border-zinc-800/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image
                src="/favicon.png"
                alt="BarcodeSense"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-base text-white">
              BarcodeSense
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === link.href 
                    ? 'text-white bg-white/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu - Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9"></div>
            ) : user ? (
              <Link href="/app">
                <Button size="sm">Go to App</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={onAuthClick}
                  className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                >
                  Sign In
                </button>
                <Link href="/app">
                  <Button size="sm">Try Free</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-card border-t border-zinc-800">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" onClick={onAuthClick} className="w-full">
                    Sign In
                  </Button>
                  <Link href="/app" className="w-full">
                    <Button className="w-full">Try Free</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
