'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { auth, supabase } from '@/lib/supabase'
import { readProfile, type FoodProfile } from '@/lib/profile'

interface AuthContextValue {
  user: any
  loading: boolean
  /** The signed-in person's diets and allergens. Empty when signed out. */
  profile: FoodProfile
  saveProfile: (profile: FoodProfile, displayName?: string) => Promise<void>
  /**
   * Send the visitor to the sign in page, remembering where they were so they
   * land back there afterwards.
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
    // getSession reads the stored session without a network round trip, so
    // protected pages render immediately instead of waiting on getUser.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
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
      router.replace(`/signin${qs ? `?${qs}` : ''}`)
    },
    [router, pathname]
  )

  const profile = useMemo(() => readProfile(user), [user])

  const saveProfile = useCallback(async (next: FoodProfile, displayName?: string) => {
    const { data, error } = await supabase.auth.updateUser({ data: { food_profile: next, ...(displayName !== undefined ? { display_name: displayName.trim() } : {}) } })
    if (error) throw error
    if (data.user) setUser(data.user)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, profile, saveProfile, requireSignIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
