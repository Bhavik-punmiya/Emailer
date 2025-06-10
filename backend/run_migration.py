import os
import pg8000
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    # Database connection parameters
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("DATABASE_URL not found in environment variables")
        return
    
    try:
        # Parse the DATABASE_URL
        # Example: postgres://user:password@host:port/dbname
        import re
        m = re.match(r"postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)", db_url)
        if not m:
            print("DATABASE_URL format is invalid")
            return
        user, password, host, port, database = m.groups()
        port = int(port) if port else 5432
        # Connect using pg8000
        conn = pg8000.connect(user=user, password=password, host=host, port=port, database=database)
        cursor = conn.cursor()
        
        print("Connected to database successfully (pg8000)")
        
        # Read and execute the migration SQL
        with open('fix_database_templates.sql', 'r') as file:
            sql_script = file.read()
        
        # Split the script into individual statements
        statements = sql_script.split(';')
        
        for statement in statements:
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    print(f"Executed: {statement[:50]}...")
                except Exception as e:
                    print(f"Error executing statement: {e}")
                    print(f"Statement: {statement}")
        
        # Commit the changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Verify the table exists
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'email_templates'
        """)
        
        result = cursor.fetchone()
        if result:
            print("✅ email_templates table exists")
        else:
            print("❌ email_templates table does not exist")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_migration() 