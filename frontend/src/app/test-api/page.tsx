'use client';

import { useState, useEffect } from 'react';

export default function TestAPI() {
  const [result, setResult] = useState<string>('Loading...');

  useEffect(() => {
    const testAPI = async () => {
      try {
        // Test without auth first
        const response = await fetch('/api/rankings/leaderboard/?period_type=WEEKLY');
        const text = await response.text();
        setResult(`Status: ${response.status}\nResponse: ${text}`);
      } catch (error) {
        const err = error as Error;
        setResult(`Error: ${err.message}\nStack: ${err.stack}`);
      }
    };

    testAPI();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
        {result}
      </pre>
    </div>
  );
}
