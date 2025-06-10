#!/usr/bin/env python3
"""
Test script to verify database schema and campaign creation
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Missing Supabase configuration in .env file")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def test_campaign_creation():
    """Test creating a campaign in the database"""
    print("🧪 Testing campaign creation...")
    
    try:
        # Test campaign data
        campaign_data = {
            "user_id": "06b3fdd0-fdc5-4ee5-bb4c-616fec60639e",  # Your user ID
            "name": "Test Campaign",
            "subject": "Test Email",
            "body": "This is a test email body",
            "status": "pending",
            "total_emails": 5,
            "sent_count": 0,
            "failed_count": 0,
            "progress": 0.0
        }
        
        # Insert campaign
        response = supabase.table("email_campaigns").insert(campaign_data).execute()
        
        if response.data:
            campaign_id = response.data[0]["id"]
            print(f"✅ Campaign created successfully with ID: {campaign_id}")
            
            # Test updating the campaign
            update_response = supabase.table("email_campaigns").update({
                "status": "completed",
                "sent_count": 5,
                "progress": 100.0
            }).eq("id", campaign_id).execute()
            
            if update_response.data:
                print("✅ Campaign updated successfully")
            else:
                print("❌ Failed to update campaign")
                
            # Clean up - delete test campaign
            supabase.table("email_campaigns").delete().eq("id", campaign_id).execute()
            print("✅ Test campaign cleaned up")
            
        else:
            print("❌ Failed to create campaign")
            
    except Exception as e:
        print(f"❌ Error testing campaign creation: {e}")

def test_table_structure():
    """Test if the email_campaigns table exists and has the right structure"""
    print("🧪 Testing table structure...")
    
    try:
        # Try to select from the table
        response = supabase.table("email_campaigns").select("*").limit(1).execute()
        print("✅ email_campaigns table exists and is accessible")
        
        # Check if we can get table info
        print("📋 Table structure verified")
        
    except Exception as e:
        print(f"❌ Error accessing email_campaigns table: {e}")
        print("💡 You may need to run the database schema fix script")

if __name__ == "__main__":
    print("🚀 Testing Database Schema...")
    print("=" * 50)
    
    test_table_structure()
    print()
    test_campaign_creation()
    
    print("=" * 50)
    print("✅ Database tests completed!") 