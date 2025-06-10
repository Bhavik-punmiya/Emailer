#!/usr/bin/env python3
"""
Test script for email settings functionality
This script tests the new email settings endpoints
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8080")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_auth_token():
    """Get authentication token from Supabase"""
    try:
        from supabase import create_client
        
        supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        # You'll need to provide test credentials
        email = input("Enter test email: ")
        password = input("Enter test password: ")
        
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if response.session:
            return response.session.access_token
        else:
            print("❌ Authentication failed")
            return None
            
    except Exception as e:
        print(f"❌ Error getting auth token: {e}")
        return None

def test_endpoint(endpoint, method="GET", data=None, token=None):
    """Test an API endpoint"""
    url = f"{API_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json"
    }
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
            
        print(f"📡 {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   Response: {json.dumps(result, indent=2)}")
            except:
                print(f"   Response: {response.text}")
            return True
        else:
            try:
                error = response.json()
                print(f"   Error: {json.dumps(error, indent=2)}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    print("🧪 Testing Email Settings Functionality")
    print("=" * 50)
    
    # Test 1: Basic API health check
    print("\n1. Testing API health check...")
    test_endpoint("/")
    
    # Test 2: Authentication
    print("\n2. Testing authentication...")
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        return
    
    test_endpoint("/api/test-auth", token=token)
    
    # Test 3: Get email settings (should return 404 if not configured)
    print("\n3. Testing get email settings...")
    test_endpoint("/api/email-settings", token=token)
    
    # Test 4: Save email settings
    print("\n4. Testing save email settings...")
    test_settings = {
        "email_host": "smtp.gmail.com",
        "email_port": 587,
        "email_user": "test@example.com",
        "email_password": "test-password",
        "email_display_name": "Test User"
    }
    
    success = test_endpoint("/api/email-settings", method="POST", data=test_settings, token=token)
    
    if success:
        # Test 5: Get email settings again (should return the saved settings)
        print("\n5. Testing get email settings after save...")
        test_endpoint("/api/email-settings", token=token)
        
        # Test 6: Test email settings (this will actually try to send an email)
        print("\n6. Testing email settings...")
        print("⚠️  This will attempt to send a test email!")
        proceed = input("Do you want to proceed? (y/n): ")
        
        if proceed.lower() == 'y':
            test_endpoint("/api/email-settings/test", method="POST", data=test_settings, token=token)
        else:
            print("⏭️  Skipping email test")
    
    # Test 7: Dashboard stats (should include has_email_settings)
    print("\n7. Testing dashboard stats...")
    test_endpoint("/api/dashboard/stats", token=token)
    
    print("\n" + "=" * 50)
    print("✅ Email settings testing completed!")

if __name__ == "__main__":
    main() 