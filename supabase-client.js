// Supabase Client Configuration
// Credentials are loaded from config.js
const SUPABASE_URL = CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG?.SUPABASE_ANON_KEY;

// Check if credentials are available
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase credentials not found in CONFIG');
}

// Initialize Supabase client with auth options
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Auth helper functions
const auth = {
  // Sign up new user
  async signUp(email, password) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign in existing user
  async signIn(email, password) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    if (!supabaseClient) return null;
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    if (!supabaseClient) return () => {};
    return supabaseClient.auth.onAuthStateChange(callback);
  },

  // OAuth sign in
  async signInWithOAuth(provider, options) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options
    });
    if (error) throw error;
    return data;
  },

  // Send password reset email
  async resetPasswordForEmail(email) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectUrl = isLocal 
      ? 'http://localhost:3000/app.html'
      : 'https://barcodesense.vercel.app/app.html';
      
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    if (error) throw error;
    return data;
  },

  // Update user password
  async updatePassword(newPassword) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const { data, error } = await supabaseClient.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  }
};

// Database helper functions
const db = {
  // Save scanned product
  async saveScannedProduct(barcode, productName, productData) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseClient
      .from('scanned_products')
      .insert([
        {
          user_id: user.id,
          barcode,
          product_name: productName,
          product_data: productData,
        }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  // Get user's scanned products
  async getScannedProducts(limit = 50) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseClient
      .from('scanned_products')
      .select('*')
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Delete scanned product
  async deleteScannedProduct(id) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabaseClient
      .from('scanned_products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Save user preferences
  async saveUserPreferences(dietaryRestrictions, allergies) {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseClient
      .from('user_preferences')
      .upsert([
        {
          user_id: user.id,
          dietary_restrictions: dietaryRestrictions,
          allergies: allergies,
          updated_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  // Get user preferences
  async getUserPreferences() {
    if (!supabaseClient) throw new Error('Supabase client not initialized');
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }
};

// Export for use in other files
window.supabaseAuth = auth;
window.supabaseDB = db;
