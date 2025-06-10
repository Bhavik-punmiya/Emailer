#!/usr/bin/env python3
"""
Test script for Google Cloud Functions deployment
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_gcf_function(function_url):
    """Test the deployed Google Cloud Function"""
    
    print(f"🧪 Testing Google Cloud Function: {function_url}")
    print("=" * 50)
    
    # Test 1: Root endpoint
    print("1. Testing root endpoint...")
    try:
        response = requests.get(f"{function_url}/")
        if response.status_code == 200:
            print("✅ Root endpoint working")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Root endpoint error: {e}")
    
    print()
    
    # Test 2: Test auth endpoint (should fail without token)
    print("2. Testing auth endpoint without token...")
    try:
        response = requests.get(f"{function_url}/api/test-auth")
        if response.status_code == 401:
            print("✅ Auth endpoint correctly rejecting unauthorized requests")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Auth endpoint error: {e}")
    
    print()
    
    # Test 3: CORS preflight
    print("3. Testing CORS preflight...")
    try:
        response = requests.options(f"{function_url}/api/test-auth", headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization'
        })
        if response.status_code == 204:
            print("✅ CORS preflight working")
        else:
            print(f"⚠️  CORS preflight response: {response.status_code}")
    except Exception as e:
        print(f"❌ CORS preflight error: {e}")
    
    print()
    
    # Test 4: Send emails endpoint (should fail without auth)
    print("4. Testing send emails endpoint without auth...")
    try:
        test_data = {
            "contacts": [
                {
                    "name": "Test User",
                    "email": "test@example.com"
                }
            ],
            "template": {
                "subject": "Test Email",
                "body": "This is a test email"
            },
            "user_id": "test-user"
        }
        
        response = requests.post(f"{function_url}/api/send-emails", json=test_data)
        if response.status_code == 401:
            print("✅ Send emails endpoint correctly rejecting unauthorized requests")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            if response.text:
                print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Send emails endpoint error: {e}")
    
    print()
    print("=" * 50)
    print("🎯 Test Summary:")
    print("If all tests show ✅, your function is deployed correctly!")
    print("Next steps:")
    print("1. Set your environment variables in Google Cloud Console")
    print("2. Test with a valid authentication token")
    print("3. Update your frontend's NEXT_PUBLIC_API_URL")

if __name__ == "__main__":
    # Get function URL from environment or user input
    function_url = os.getenv("GCF_FUNCTION_URL")
    
    if not function_url:
        function_url = input("Enter your Google Cloud Function URL: ").strip()
        if not function_url:
            print("❌ No function URL provided")
            exit(1)
    
    # Remove trailing slash if present
    function_url = function_url.rstrip('/')
    
    test_gcf_function(function_url) 