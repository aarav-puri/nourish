'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/supabase'

interface AuthContextValue {
  user: any
  loading: boolean
  /**
   * Send the visitor to the sign in page, remembering where they were so they
   * land back there afterwards. Replaces the old global sign in dialog:
   * signing in is a page now, not something that interrupts one.
   */
  requireSignIn: (opts?: { reason?: 'save'; next?: string }) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const requireSignIn = useCallback(
    (opts?: { reason?: 'save'; next?: string }) => {
      const params = new URLSearchParams()
      const next = opts?.next ?? pathname
      // Never bounce back to an auth page after signing in.
      if (next && !next.startsWith('/signin') && !next.startsWith('/signup')) {
        params.set('next', next)
      }
      if (opts?.reason) params.set('reason', opts.reason)
      const qs = params.toString()
      router.push(`/signin${qs ? `?${qs}` : ''}`)
    },
    [router, pathname]
  )

  return <AuthContext.Provider value={{ user, loading, requireSignIn }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
