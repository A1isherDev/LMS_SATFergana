import { healthCheck, authApi, classesApi, homeworkApi, questionBankApi } from '@/utils/api';

// Test utility for API connections
export class ApiTester {
  private static results: { [key: string]: boolean | string } = {};

  static async runAllTests() {
    console.log('🧪 Starting API Connection Tests...\n');
    
    this.results = {};
    
    // Test 1: Backend Health Check
    await this.testBackendHealth();
    
    // Test 2: Authentication (if we have test credentials)
    await this.testAuthentication();
    
    // Test 3: API Endpoints (requires authentication)
    await this.testApiEndpoints();
    
    // Print results
    this.printResults();
    
    return this.results;
  }

  private static async testBackendHealth() {
    console.log('🏥 Testing Backend Health...');
    try {
      const isHealthy = await healthCheck();
      this.results['backend_health'] = isHealthy;
      console.log(isHealthy ? '✅ Backend is healthy' : '❌ Backend is not responding');
    } catch (error) {
      this.results['backend_health'] = `Error: ${error}`;
      console.log('❌ Backend health check failed:', error);
    }
    console.log('');
  }

  private static async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    // Test with invalid credentials first
    try {
      await authApi.login('test@example.com', 'wrongpassword');
      this.results['auth_invalid'] = false;
      console.log('❌ Invalid login should have failed');
    } catch (error) {
      this.results['auth_invalid'] = true;
      console.log('✅ Invalid login correctly rejected');
    }
    
    // Test with valid credentials (if available)
    const testEmail = process.env.NEXT_PUBLIC_TEST_EMAIL;
    const testPassword = process.env.NEXT_PUBLIC_TEST_PASSWORD;
    
    if (testEmail && testPassword) {
      try {
        const response = await authApi.login(testEmail, testPassword);
        this.results['auth_valid'] = true;
        console.log('✅ Valid login successful');
        
        // Store token for subsequent tests
        localStorage.setItem('test_token', (response as any).access);
      } catch (error) {
        this.results['auth_valid'] = `Error: ${error}`;
        console.log('❌ Valid login failed:', error);
      }
    } else {
      this.results['auth_valid'] = 'Skipped (no test credentials)';
      console.log('⏭ Skipped valid login test (no test credentials)');
    }
    console.log('');
  }

  private static async testApiEndpoints() {
    console.log('🔗 Testing API Endpoints...');
    
    const token = localStorage.getItem('test_token') || localStorage.getItem('access_token');
    
    if (!token) {
      this.results['api_endpoints'] = 'Skipped (no auth token)';
      console.log('⏭ Skipped API endpoint tests (no authentication token)');
      console.log('');
      return;
    }
    
    // Test Classes API
    try {
      const classes = await classesApi.getClasses();
      this.results['classes_api'] = true;
      console.log('✅ Classes API working');
    } catch (error) {
      this.results['classes_api'] = `Error: ${error}`;
      console.log('❌ Classes API failed:', error);
    }
    
    // Test Homework API
    try {
      const homework = await homeworkApi.getHomework();
      this.results['homework_api'] = true;
      console.log('✅ Homework API working');
    } catch (error) {
      this.results['homework_api'] = `Error: ${error}`;
      console.log('❌ Homework API failed:', error);
    }
    
    // Test Question Bank API
    try {
      const questions = await questionBankApi.getQuestions({ limit: 5 });
      this.results['questionbank_api'] = true;
      console.log('✅ Question Bank API working');
    } catch (error) {
      this.results['questionbank_api'] = `Error: ${error}`;
      console.log('❌ Question Bank API failed:', error);
    }
    
    console.log('');
  }

  private static printResults() {
    console.log('📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(this.results).forEach(([test, result]) => {
      const status = typeof result === 'boolean' ? (result ? '✅' : '❌') : '⚠️';
      console.log(`${status} ${test}: ${result}`);
    });
    
    const passedTests = Object.values(this.results).filter(r => r === true).length;
    const totalTests = Object.keys(this.results).length;
    
    console.log('\n📈 Overall Status:');
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! API integration is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the errors above.');
    }
  }

  // Test specific API endpoint
  static async testEndpoint(apiCall: () => Promise<any>, testName: string) {
    console.log(`🧪 Testing ${testName}...`);
    try {
      const result = await apiCall();
      console.log(`✅ ${testName} successful`);
      return { success: true, data: result };
    } catch (error) {
      console.log(`❌ ${testName} failed:`, error);
      return { success: false, error };
    }
  }

  // Test network connectivity
  static async testNetworkConnectivity() {
    console.log('🌐 Testing Network Connectivity...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/health/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ Network connectivity working');
        return true;
      } else {
        console.log('❌ Network connectivity failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.log('❌ Network connectivity failed:', error);
      return false;
    }
  }

  // Test CORS configuration
  static async testCorsConfiguration() {
    console.log('🌐 Testing CORS Configuration...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/health/`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      };
      
      console.log('CORS Headers:', corsHeaders);
      
      if (corsHeaders['Access-Control-Allow-Origin'] === '*' || 
          corsHeaders['Access-Control-Allow-Origin'] === window.location.origin) {
        console.log('✅ CORS configuration working');
        return true;
      } else {
        console.log('⚠️ CORS configuration may need adjustment');
        return false;
      }
    } catch (error) {
      console.log('❌ CORS test failed:', error);
      return false;
    }
  }
}

// Export for use in components
export default ApiTester;
