import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Auth helper functions
export const auth = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async resetPassword(email: string) {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/reset-password`
      : process.env.NEXT_PUBLIC_APP_URL + '/auth/reset-password'
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    if (error) throw error
    return data
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
    return data
  },

  async uploadAvatar(file: File) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '0' })
    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
    // Bust caches on repeated uploads to the same path.
    const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

    const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } })
    if (error) throw error
    return data
  },

  async removeAvatar() {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    await supabase.storage.from('avatars').remove([
      `${user.id}/avatar.jpg`,
      `${user.id}/avatar.jpeg`,
      `${user.id}/avatar.png`,
      `${user.id}/avatar.webp`,
      `${user.id}/avatar.gif`,
    ])

    const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: null } })
    if (error) throw error
    return data
  },

  async deleteAccount() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('User not authenticated')

    const response = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || 'Failed to delete account')
    }

    await supabase.auth.signOut()
  },

  async signInWithGoogle() {
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/app`
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/app'

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    })
    if (error) throw error
    return data
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// Database helper functions
export const db = {
  async saveScannedProduct(barcode: string, productName: string, productData: any) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('scanned_products')
      .insert([{
        user_id: user.id,
        barcode,
        product_name: productName,
        product_data: productData,
      }])
      .select()

    if (error) throw error
    return data
  },

  async getScannedProducts(limit = 50) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('scanned_products')
      .select('*')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  async deleteScannedProduct(id: string) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('scanned_products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  async clearAllScannedProducts() {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('scanned_products')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
  },

  async getAIUsageToday() {
    const user = await auth.getCurrentUser()
    if (!user || !user.email) throw new Error('User not authenticated')

    // Get today's date in user's local timezone as YYYY-MM-DD string
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Track by email to prevent abuse from account deletion/recreation
    // Use maybeSingle() instead of single() to avoid 406 when no row exists yet
    const { data, error } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('email', user.email)
      .eq('date', today)
      .maybeSingle()

    if (error) {
      console.error('AI usage query error:', error)
      throw error
    }
    return data?.count || 0
  },

  async incrementAIUsage() {
    const user = await auth.getCurrentUser()
    if (!user || !user.email) throw new Error('User not authenticated')

    // Get today's date in user's local timezone as YYYY-MM-DD string
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Track by email to prevent abuse from account deletion/recreation
    // Use maybeSingle() to avoid 406 when no row exists yet
    const { data: existing } = await supabase
      .from('ai_usage')
      .select('id, count')
      .eq('email', user.email)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('ai_usage')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Create new record with email
      const { error } = await supabase
        .from('ai_usage')
        .insert([{
          user_id: user.id,
          email: user.email,
          date: today,
          count: 1,
        }])

      if (error) throw error
    }
  },

  async saveAIInsight(barcode: string, productName: string, insightType: string, insightData: any) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('ai_insights')
      .insert([{
        user_id: user.id,
        barcode,
        product_name: productName,
        insight_type: insightType,
        insight_data: insightData,
      }])
      .select()

    if (error) throw error
    return data
  },

  async getAIInsights(barcode?: string, limit = 50) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (barcode) {
      query = query.eq('barcode', barcode)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  async deleteAIInsight(id: string) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  async deleteAIInsightsByBarcode(barcode: string) {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('barcode', barcode)
      .eq('user_id', user.id)

    if (error) throw error
  },

  async clearAllAIInsights() {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error
  },
}
