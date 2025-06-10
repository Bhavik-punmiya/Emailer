import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def create_templates_table():
    # Supabase configuration
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        return
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        print("Connected to Supabase successfully")
        
        # SQL to create the email_templates table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS email_templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            attachments JSONB DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Create indexes
        create_indexes_sql = """
        CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at);
        """
        
        # Execute the SQL using Supabase's rpc function
        try:
            # Use raw SQL execution
            result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
            print("✅ email_templates table created successfully")
            
            # Create indexes
            supabase.rpc('exec_sql', {'sql': create_indexes_sql}).execute()
            print("✅ Indexes created successfully")
            
        except Exception as e:
            print(f"Error creating table: {e}")
            print("Trying alternative approach...")
            
            # Alternative: Check if table exists first
            try:
                # Try to query the table to see if it exists
                result = supabase.table("email_templates").select("id").limit(1).execute()
                print("✅ email_templates table already exists")
            except Exception as table_error:
                print(f"Table doesn't exist: {table_error}")
                print("You may need to create the table manually in Supabase dashboard")
                print("Go to your Supabase project → SQL Editor and run:")
                print(create_table_sql)
        
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        print("Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")

if __name__ == "__main__":
    create_templates_table() 