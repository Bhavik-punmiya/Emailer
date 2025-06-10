#!/usr/bin/env python3
"""
Test script to verify backend connectivity
"""

import requests
import json

def test_backend_connectivity():
    """Test if the backend is accessible"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Backend Connectivity...")
    print("=" * 50)
    
    # Test 1: Basic endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test 2: CORS preflight
    try:
        response = requests.options(f"{base_url}/api/test-auth")
        print(f"✅ CORS preflight: {response.status_code}")
        print(f"   CORS headers: {dict(response.headers)}")
    except Exception as e:
        print(f"❌ CORS preflight failed: {e}")
    
    # Test 3: Auth endpoint (should fail without token)
    try:
        response = requests.get(f"{base_url}/api/test-auth")
        print(f"❌ Auth endpoint without token: {response.status_code} (expected 401)")
    except Exception as e:
        print(f"❌ Auth endpoint failed: {e}")
    
    # Test 4: Auth endpoint with invalid token
    try:
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{base_url}/api/test-auth", headers=headers)
        print(f"✅ Auth endpoint with invalid token: {response.status_code} (expected 401)")
    except Exception as e:
        print(f"❌ Auth endpoint with invalid token failed: {e}")
    
    print("=" * 50)
    print("✅ Backend connectivity tests completed!")

if __name__ == "__main__":
    test_backend_connectivity() 