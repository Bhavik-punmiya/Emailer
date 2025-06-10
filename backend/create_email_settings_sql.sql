-- Email Settings Table Creation Script
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
    email_port INTEGER NOT NULL DEFAULT 587,
    email_user VARCHAR(255) NOT NULL,
    email_password TEXT NOT NULL,
    email_display_name VARCHAR(255) DEFAULT 'Bulk Email Sender',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_settings_user_id ON email_settings(user_id);

-- Enable Row Level Security
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own settings
CREATE POLICY "Users can view own email settings" ON email_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own settings
CREATE POLICY "Users can insert own email settings" ON email_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own settings
CREATE POLICY "Users can update own email settings" ON email_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own settings
CREATE POLICY "Users can delete own email settings" ON email_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 