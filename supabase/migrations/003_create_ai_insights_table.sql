-- Create ai_insights table to store AI-generated insights for products
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_insights_barcode ON ai_insights(barcode);

-- Create index on insight_type for filtering
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at ON ai_insights(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own insights
CREATE POLICY "Users can view their own AI insights"
  ON ai_insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can only insert their own insights
CREATE POLICY "Users can insert their own AI insights"
  ON ai_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can only delete their own insights
CREATE POLICY "Users can delete their own AI insights"
  ON ai_insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights for scanned products';
COMMENT ON COLUMN ai_insights.insight_type IS 'Type of insight: alternatives, mood_*, diet_compatibility, eco_impact';
COMMENT ON COLUMN ai_insights.insight_data IS 'JSON data containing the AI insight response';
