'use client';

import { useState, useEffect } from 'react';

export default function DebugAuth() {
  const [authInfo, setAuthInfo] = useState<any>({});

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const user = localStorage.getItem('user');
      
      setAuthInfo({
        accessToken: accessToken ? `${accessToken.substring(0, 20)}... (${accessToken.length} chars)` : 'none',
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}... (${refreshToken.length} chars)` : 'none',
        user: user || 'none',
        keys: Object.keys(localStorage)
      });
    };

    checkAuth();
    
    // Listen for storage changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const testLogin = () => {
    // Simulate a token for testing
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    localStorage.setItem('access_token', fakeToken);
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Current Auth State:</h2>
        <pre className="text-sm">
          {JSON.stringify(authInfo, null, 2)}
        </pre>
      </div>

      <div className="space-x-4">
        <button 
          onClick={clearAuth}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Auth Data
        </button>
        
        <button 
          onClick={testLogin}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Set Fake Token (for testing)
        </button>
        
        <a 
          href="/login"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
        >
          Go to Login
        </a>
        
        <a 
          href="/rankings"
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 inline-block"
        >
          Go to Rankings
        </a>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>1. Check if you have tokens stored</p>
        <p>2. If not, go to login page</p>
        <p>3. After login, check if tokens appear</p>
        <p>4. Then try rankings page</p>
      </div>
    </div>
  );
}
