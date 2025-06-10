-- Simple Database Fix - Add Missing Columns
-- Run this in your Supabase SQL Editor

-- Add missing columns to email_campaigns table
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS total_emails INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update existing campaigns to have default values
UPDATE email_campaigns 
SET 
    total_emails = 0,
    sent_count = 0,
    failed_count = 0,
    progress = 0.0
WHERE total_emails IS NULL;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_campaigns' 
ORDER BY ordinal_position; 