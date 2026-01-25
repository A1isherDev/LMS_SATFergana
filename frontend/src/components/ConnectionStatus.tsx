'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { healthCheck } from '@/utils/api';

interface ConnectionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

interface ConnectionStatus {
  isOnline: boolean;
  isBackendHealthy: boolean;
  lastChecked: Date | null;
  error?: string;
}

export default function ConnectionStatus({ 
  showDetails = false, 
  compact = false, 
  className = '' 
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    isBackendHealthy: false,
    lastChecked: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const isBackendHealthy = await healthCheck();
      setStatus({
        isOnline: navigator.onLine,
        isBackendHealthy,
        lastChecked: new Date(),
      });
    } catch (error) {
      setStatus({
        isOnline: navigator.onLine,
        isBackendHealthy: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check connection on mount
    checkConnection();

    // Check connection periodically
    const interval = setInterval(checkConnection, 30000); // Every 30 seconds

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      checkConnection();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (!status.isBackendHealthy) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-600';
    if (!status.isBackendHealthy) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (!status.isBackendHealthy) return 'Backend Issues';
    return 'Connected';
  };

  const getStatusMessage = () => {
    if (!status.isOnline) {
      return 'No internet connection';
    }
    
    if (!status.isBackendHealthy) {
      return status.error || 'Backend server is not responding';
    }
    
    return 'All systems operational';
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </h3>
            <p className="text-sm text-gray-600">
              {getStatusMessage()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {showDetails && status.lastChecked && (
            <span className="text-xs text-gray-500">
              Last checked: {status.lastChecked.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh connection"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Network:</span>
              <span className={`font-medium ${status.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {status.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Backend:</span>
              <span className={`font-medium ${status.isBackendHealthy ? 'text-green-600' : 'text-orange-600'}`}>
                {status.isBackendHealthy ? 'Healthy' : 'Issues'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">API URL:</span>
              <span className="font-medium text-gray-900">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">User Agent:</span>
              <span className="font-medium text-gray-900 text-xs">
                {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 30) + '...' : 'N/A'}
              </span>
            </div>
          </div>
          
          {status.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Error Details:</strong> {status.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
