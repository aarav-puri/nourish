// Supabase Client Configuration
// Credentials are loaded from config.js
const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

// Initialize Supabase client with auth options
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
const auth = {
  // Sign up new user
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign in existing user
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helper functions
const db = {
  // Save scanned product
  async saveScannedProduct(barcode, productName, productData) {
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
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
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
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
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('scanned_products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Save user preferences
  async saveUserPreferences(dietaryRestrictions, allergies) {
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
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
    const user = await auth.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
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
