import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def create_email_settings_table():
    """Create the email_settings table in Supabase"""
    
    # SQL to create the email_settings table
    create_table_sql = """
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
    """
    
    try:
        # Execute the SQL using Supabase's rpc function
        # Note: We'll need to run this SQL directly in Supabase dashboard
        # or use a different approach since Supabase client doesn't support DDL
        print("SQL to create email_settings table:")
        print(create_table_sql)
        print("\nPlease run this SQL in your Supabase SQL editor.")
        
        # For now, let's create a simple test to verify the table exists
        print("\nTesting table access...")
        result = supabase.table("email_settings").select("id").limit(1).execute()
        print("Table access successful!")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Table might not exist yet. Please run the SQL above in Supabase dashboard.")

if __name__ == "__main__":
    create_email_settings_table() 