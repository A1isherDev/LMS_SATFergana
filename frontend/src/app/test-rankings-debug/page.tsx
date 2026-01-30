'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';

export default function TestRankingsDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('Starting debug test...');
    
    // Test 1: Check if localStorage is available
    if (typeof window !== 'undefined') {
      addLog('✅ Window object available');
      
      // Check for token
      const token = localStorage.getItem('access_token');
      if (token) {
        addLog(`✅ Token found: ${token.substring(0, 20)}...`);
      } else {
        addLog('❌ No token found in localStorage');
      }
    } else {
      addLog('❌ Window object not available');
    }

    // Test 2: Check API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    addLog(`🌐 API URL: ${apiUrl}`);

    // Test 3: Try to fetch rankings
    const fetchRankings = async () => {
      try {
        addLog('🔄 Starting API fetch...');
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        
        if (!token) {
          addLog('❌ Cannot fetch: No authentication token');
          setError('No authentication token found');
          return;
        }

        const response = await fetch(`${apiUrl}/rankings/leaderboard/?period_type=WEEKLY&limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        addLog(`📡 Response status: ${response.status}`);
        addLog(`📡 Response ok: ${response.ok}`);

        if (response.ok) {
          const data = await response.json();
          addLog(`✅ Data received: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
          
          if (data.leaderboard) {
            addLog(`✅ Leaderboard entries: ${data.leaderboard.length}`);
            if (data.leaderboard.length > 0) {
              const first = data.leaderboard[0];
              addLog(`👤 First student: ${first.student_name} (bio: ${first.student_bio || 'None'})`);
            }
          } else {
            addLog('❌ No leaderboard field in response');
          }
        } else {
          const errorText = await response.text();
          addLog(`❌ Error response: ${errorText}`);
          setError(`API Error: ${response.status} - ${errorText}`);
        }
      } catch (err) {
        addLog(`❌ Fetch error: ${err}`);
        setError(`Fetch error: ${err}`);
      }
    };

    // Delay fetch to ensure DOM is ready
    setTimeout(fetchRankings, 1000);

  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6" style={{ color: '#111827' }}>Rankings Debug Test</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 px-4 py-3 rounded mb-4">
              <strong style={{ color: '#7f1d1d' }}>Error:</strong>{' '}
              <span style={{ color: '#991b1b' }}>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#111827' }}>Debug Logs:</h2>
            <div 
              className="rounded p-4 font-mono text-sm max-h-96 overflow-y-auto" 
              style={{ 
                backgroundColor: '#111827',
                color: '#4ade80'
              }}
            >
              {logs.map((log, index) => (
                <div key={index} className="mb-1" style={{ color: '#4ade80' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
