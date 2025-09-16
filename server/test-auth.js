const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Test configuration
const BASE_URL = 'http://localhost:3000/api/v1/auth';
const TEST_EMAIL = `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Test@1234';

// Helper function to make API calls
async function testEndpoint(method, endpoint, data = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\nTesting ${method.toUpperCase()} ${url}`);
    
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on HTTP error status
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    throw error;
  }
}

// Test signup
async function testSignup() {
  console.log('\n--- Testing Signup ---');
  
  const userData = {
    firstname: 'Test',
    lastname: 'User',
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    role: 'student'
  };

  return testEndpoint('post', '/signup', userData);
}

// Test login
async function testLogin() {
  console.log('\n--- Testing Login ---');
  
  const loginData = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  };

  return testEndpoint('post', '/login', loginData);
}

// Run tests
async function runTests() {
  try {
    // Test signup
    const signupResponse = await testSignup();
    
    if (signupResponse.status === 201) {
      console.log('✅ Signup test passed!');
      
      // Test login with the newly created account
      const loginResponse = await testLogin();
      
      if (loginResponse.status === 200 && loginResponse.data.token) {
        console.log('✅ Login test passed!');
        console.log('\n🎉 All tests passed successfully!');
      } else {
        console.error('❌ Login test failed!');
      }
    } else {
      console.error('❌ Signup test failed!');
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run the tests
runTests();
