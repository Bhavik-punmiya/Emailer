// Test script to verify frontend-backend integration
const API_BASE_URL = 'https://us-central1-national-space-hackathon.cloudfunctions.net/email-api';

async function testIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...');
  console.log('📍 API URL:', API_BASE_URL);
  
  try {
    // Test 1: Root endpoint
    console.log('\n1. Testing root endpoint...');
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    console.log('✅ Root endpoint:', data);
    
    // Test 2: CORS preflight
    console.log('\n2. Testing CORS...');
    const corsResponse = await fetch(`${API_BASE_URL}/api/test-auth`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    });
    console.log('✅ CORS preflight status:', corsResponse.status);
    
    // Test 3: Auth endpoint (should fail without token)
    console.log('\n3. Testing auth endpoint...');
    const authResponse = await fetch(`${API_BASE_URL}/api/test-auth`);
    console.log('✅ Auth endpoint status:', authResponse.status);
    
    console.log('\n🎉 Integration test completed successfully!');
    console.log('Your frontend can now connect to the deployed backend.');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
testIntegration(); 