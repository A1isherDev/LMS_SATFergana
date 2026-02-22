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

  // Add Invitations for admins only
  const adminNavigation = user?.role === 'ADMIN'
    ? [...navigation.slice(0, 2), { name: 'Invitations', href: '/invitations', icon: User }, ...navigation.slice(2)]
    : navigation;

  const finalNavigation = adminNavigation;

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
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 mr-3 flex-shrink-0">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className={`font-black text-lg uppercase italic tracking-tighter text-slate-900 dark:text-white transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>
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
                  className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-start px-6'} py-4 rounded-[1.25rem] transition-all duration-300 group ${isActive
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xl shadow-slate-200 dark:shadow-none translate-x-1 scale-105'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`ml-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'italic' : ''} ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden lg:absolute' : 'opacity-100'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & User Menu */}
          <div className="border-t border-border px-4 py-3 space-y-4">
            <div className={`flex items-center justify-between px-4 ${collapsed ? 'lg:flex-col lg:space-y-2' : ''}`}>
              <span className={`text-[9px] font-black text-slate-400 uppercase tracking-widest ${collapsed ? 'lg:hidden' : ''}`}>System Mode</span>
              <ThemeToggle />
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => { router.push('/settings'); setMobileMenuOpen(false); }}
                className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-start px-6'} py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-[1.25rem] transition-all hover:bg-slate-50 dark:hover:bg-gray-800 group`}
                title="Settings"
              >
                <Settings className="h-5 w-5 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                <span className={`ml-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden lg:absolute' : 'opacity-100'}`}>
                  Settings
                </span>
              </button>

              <button
                onClick={handleLogout}
                className={`flex items-center ${collapsed ? 'lg:justify-center' : 'justify-start px-6'} py-4 text-red-500 hover:text-white hover:bg-red-500 rounded-[1.25rem] transition-all group`}
                title="Logout"
              >
                <LogOut className="h-5 w-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
                <span className={`ml-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden lg:absolute' : 'opacity-100'}`}>
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
                  <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                    Welcome, {user?.first_name}
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                    YOUR SAT PREPARATION DASHBOARD
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {user?.role === 'STUDENT' && <div className="hidden sm:block"><StreakBadge /></div>}
                <NotificationBell />
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {user?.role === 'STUDENT' ? 'Student' : (user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') ? 'Teacher' : 'Admin'}
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