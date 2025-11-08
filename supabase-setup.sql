-- BarcodeSense Database Setup
-- Run this in your Supabase SQL Editor

-- Create scanned_products table
CREATE TABLE IF NOT EXISTS scanned_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode TEXT NOT NULL,
  product_name TEXT,
  product_data JSONB,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scanned_products_user_id ON scanned_products(user_id);
CREATE INDEX IF NOT EXISTS idx_scanned_products_scanned_at ON scanned_products(scanned_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE scanned_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own scanned products" ON scanned_products;
DROP POLICY IF EXISTS "Users can insert their own scanned products" ON scanned_products;
DROP POLICY IF EXISTS "Users can delete their own scanned products" ON scanned_products;

-- Create RLS policies to ensure users only see their own data
CREATE POLICY "Users can view their own scanned products"
  ON scanned_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scanned products"
  ON scanned_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanned products"
  ON scanned_products FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  dietary_restrictions TEXT[],
  allergies TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);
