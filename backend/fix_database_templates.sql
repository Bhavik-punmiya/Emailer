-- Add missing fields to email_campaigns table
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS total_emails INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop existing email_templates table if it exists (to recreate with proper schema)
DROP TABLE IF EXISTS email_templates;

-- Create email_templates table with proper schema
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at);

-- Verify the table structures
SELECT 'email_campaigns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_campaigns' 
ORDER BY ordinal_position;

SELECT 'email_templates' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'email_templates' 
ORDER BY ordinal_position; 