'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        router.push(redirectTo);
      }
    }
  }, [user, isLoading, requireAuth, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
}
