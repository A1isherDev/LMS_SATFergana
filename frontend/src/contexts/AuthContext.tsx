'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '@/types';
import { authApi, usersApi, handleApiError, healthCheck } from '@/utils/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    invitation_code: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  isBackendHealthy: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const isHealthy = await healthCheck();
        setIsBackendHealthy(isHealthy);
      } catch (error) {
        console.error('Backend health check failed:', error);
        setIsBackendHealthy(false);
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getUserProfile();
          setUser(userData as User);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { access, refresh, user: userData } = response;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Set user
      setUser(userData);
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    invitation_code: string;
  }) => {
    try {
      const response = await authApi.register(userData);
      const { access, refresh, user: registeredUser } = response;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Set user
      setUser(registeredUser);
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear user
    setUser(null);
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getUserProfile();
      setUser(userData as User);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might need to re-authenticate
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isBackendHealthy,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
