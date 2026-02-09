'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, Settings, BarChart3, Home, Clock, Trophy, Brain, ChevronsLeft, ChevronsRight, Target, Bell, Menu } from 'lucide-react';
import StreakBadge from './StreakBadge';
import StudySessionTracker from './StudySessionTracker';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface LayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  useKeyboardShortcuts();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('dashboard-collapsed');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    { name: 'Digital SAT', href: '/mockexams/bluebook', icon: Target },
    { name: 'Flashcards', href: '/flashcards', icon: BookOpen },
    { name: 'Rankings', href: '/rankings', icon: Trophy },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  // Add Invitations for teachers and admins
  const teacherNavigation = user?.role === 'TEACHER' || user?.role === 'ADMIN'
    ? [...navigation.slice(0, 2), { name: 'Invitations', href: '/invitations', icon: User }, ...navigation.slice(2)]
    : navigation;

  const finalNavigation = teacherNavigation;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out transform 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64 bg-card shadow-lg border-r border-border`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center ${collapsed ? 'h-16 px-4 lg:justify-center justify-between' : 'h-16 px-4 justify-between border-b border-border'} transition-all duration-300`}>
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
              <span className={`font-bold text-xl text-foreground ml-2 transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>
                SAT Fergana
              </span>
            </div>

            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileMenuOpen(false);
                } else {
                  setCollapsed(!collapsed);
                  try { localStorage.setItem('dashboard-collapsed', (!collapsed).toString()); } catch { }
                }
              }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="text-primary p-2 rounded-md cursor-pointer bg-card border border-border shadow-sm hover:bg-muted transition-colors flex-shrink-0"
            >
              {collapsed ? <ChevronsRight className="h-6 w-6" /> : <ChevronsLeft className="h-6 w-6" />}
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {finalNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-start px-4'} py-3 text-base font-medium rounded-md transition-colors duration-200 ${isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  <span className={`ml-3 transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden lg:absolute' : 'opacity-100'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & User Menu */}
          <div className="border-t border-border px-4 py-3 space-y-4">
            <div className={`flex items-center justify-between px-2 ${collapsed ? 'lg:flex-col lg:space-y-2' : ''}`}>
              <span className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider ${collapsed ? 'lg:hidden' : ''}`}>Theme</span>
              <ThemeToggle />
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => { router.push('/settings'); setMobileMenuOpen(false); }}
                className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-start px-4'} py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors cursor-pointer`}
                title="Settings"
              >
                <Settings className="h-6 w-6 flex-shrink-0" />
                <span className={`ml-3 transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden lg:absolute' : 'opacity-100'}`}>
                  Settings
                </span>
              </button>

              <button
                onClick={handleLogout}
                className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-start px-4'} py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer`}
                title="Logout"
              >
                <LogOut className="h-6 w-6 flex-shrink-0" />
                <span className={`ml-3 transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden lg:absolute' : 'opacity-100'}`}>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top Bar */}
        <header className="bg-card shadow-sm border-b border-border sticky top-0 z-30">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 -ml-2 text-muted-foreground hover:text-foreground lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground line-clamp-1">
                    Welcome back, {user?.first_name}!
                  </h1>
                  <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                    Track your SAT preparation progress
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {user?.role === 'STUDENT' && <div className="hidden sm:block"><StreakBadge /></div>}
                <NotificationBell />
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {user?.role === 'STUDENT' ? 'Student' : user?.role === 'TEACHER' ? 'Teacher' : 'Admin'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          {children}
        </main>

        {user?.role === 'STUDENT' && <StudySessionTracker />}
      </div>
    </div>
  );
}