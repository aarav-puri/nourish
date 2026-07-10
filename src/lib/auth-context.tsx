'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth } from '@/lib/supabase'
import AuthModal from '@/components/auth/AuthModal'

interface AuthContextValue {
  user: any
  loading: boolean
  openAuthModal: (showSaveMessage?: boolean) => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [showSaveMessage, setShowSaveMessage] = useState(false)

  useEffect(() => {
    auth.getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    const { data: { subscription } } = auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const openAuthModal = (save = false) => {
    setShowSaveMessage(save)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => setAuthModalOpen(false)

  return (
    <AuthContext.Provider value={{ user, loading, openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} showSaveMessage={showSaveMessage} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
