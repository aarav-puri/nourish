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

  async getAIUsageToday() {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    const { data, error } = await supabase
      .from('ai_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data?.count || 0
  },

  async incrementAIUsage() {
    const user = await auth.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Try to increment existing record
    const { data: existing } = await supabase
      .from('ai_usage')
      .select('id, count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('ai_usage')
        .update({ count: existing.count + 1 })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Create new record
      const { error } = await supabase
        .from('ai_usage')
        .insert([{
          user_id: user.id,
          date: today,
          count: 1,
        }])

      if (error) throw error
    }
  },
}
