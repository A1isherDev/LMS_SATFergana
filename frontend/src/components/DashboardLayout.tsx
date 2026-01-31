'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, Settings, BarChart3, Home, Clock, Trophy, Brain, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('dashboard-collapsed');
      return stored === 'true';
    } catch (e) {
      return false;
    }
  });
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Initialized synchronously from localStorage to avoid sidebar width flash on navigation

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Classes', href: '/classes', icon: User },
    { name: 'Homework', href: '/homework', icon: Clock },
    { name: 'Question Bank', href: '/questionbank', icon: Brain },
    { name: 'Mock Exams', href: '/mockexams', icon: BarChart3 },
    { name: 'Flashcards', href: '/flashcards', icon: BookOpen },
    { name: 'Rankings', href: '/rankings', icon: Trophy },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-64'} bg-white shadow-lg transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center ${collapsed ? 'h-16 px-4 justify-center' : 'h-16 px-4 justify-between border-b-2 border-gray-300'} transition-all duration-300`}>
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <span className={`font-bold text-xl text-gray-900 ml-2 transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                SAT Fergana
              </span>
            </div>
            
            {!collapsed && (
              <button
                onClick={() => { setCollapsed(true); try { localStorage.setItem('dashboard-collapsed','true'); } catch (e) {} }}
                aria-label="Collapse sidebar"
                className="text-blue-600 p-2 rounded-md cursor-pointer bg-white border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors flex-shrink-0"
              >
                <ChevronsLeft className="h-6 w-6" />
              </button>
            )}
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            {collapsed && (
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => { setCollapsed(false); try { localStorage.setItem('dashboard-collapsed','false'); } catch (e) {} }}
                  aria-label="Expand sidebar"
                  className="w-12 h-12 flex items-center justify-center text-blue-600 rounded-md cursor-pointer bg-white border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors"
                >
                  <ChevronsRight className="h-6 w-6" />
                </button>
              </div>
            )}

            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-center ${collapsed ? 'w-12 h-12 mx-auto' : 'px-4 py-3 justify-start'} text-base font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-6 w-6 ${collapsed ? '' : 'flex-shrink-0'}`} />
                  <span className={`ml-3 transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden absolute' : 'opacity-100'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => router.push('/profile')}
                className={`flex items-center justify-center ${collapsed ? 'w-12 h-12 mx-auto' : 'px-4 py-3 justify-start'} text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer`}
                title="Settings"
              >
                <Settings className={`h-6 w-6 ${collapsed ? '' : 'flex-shrink-0'}`} />
                <span className={`ml-3 transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden absolute' : 'opacity-100'}`}>
                  Settings
                </span>
              </button>

              <button
                onClick={handleLogout}
                className={`flex items-center justify-center ${collapsed ? 'w-12 h-12 mx-auto' : 'px-4 py-3 justify-start'} text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer`}
                title="Logout"
              >
                <LogOut className={`h-6 w-6 ${collapsed ? '' : 'flex-shrink-0'}`} />
                <span className={`ml-3 transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden absolute' : 'opacity-100'}`}>
                  Logout
                </span>
              </button>
            </div>
          </div> 
        </div>
      </div>

      {/* Main Content */}
      <div className={`${collapsed ? 'pl-20' : 'pl-64'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.first_name}!
                </h1>
                <p className="text-sm text-gray-600">
                  Track your SAT preparation progress and improve your scores
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.role === 'STUDENT' ? 'Student' : user?.role === 'TEACHER' ? 'Teacher' : 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}