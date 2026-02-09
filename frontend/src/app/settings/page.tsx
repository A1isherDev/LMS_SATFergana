'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Bell, Palette, Globe, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar */}
                        <div className="md:col-span-1 space-y-2">
                            {[
                                { id: 'profile', label: 'Profile', icon: User },
                                { id: 'security', label: 'Security', icon: Lock },
                                { id: 'notifications', label: 'Notifications', icon: Bell },
                                { id: 'appearance', label: 'Appearance', icon: Palette },
                                { id: 'language', label: 'Language', icon: Globe },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeSection === item.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5 mr-3" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="md:col-span-3">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                                {activeSection === 'profile' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h2>
                                        <div className="flex items-center space-x-6 mb-8">
                                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors">
                                                    Change Avatar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                                <input
                                                    type="text"
                                                    defaultValue={user?.first_name}
                                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                                <input
                                                    type="text"
                                                    defaultValue={user?.last_name}
                                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    defaultValue={user?.email}
                                                    disabled
                                                    className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Contact support to change your email.</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    placeholder="Tell us about yourself..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'appearance' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Appearance</h2>
                                        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Theme Preference</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose between light and dark mode</p>
                                                </div>
                                                <ThemeToggle />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'security' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security</h2>
                                        <div className="space-y-4">
                                            <button className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors flex justify-between items-center group">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Change Password</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your password to keep your account secure</p>
                                                </div>
                                                <Lock className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Placeholders for other sections */}
                                {(activeSection === 'notifications' || activeSection === 'language') && (
                                    <div className="text-center py-12">
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                            <Settings className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Coming Soon</h3>
                                        <p className="text-gray-500 dark:text-gray-400">This setting section is under development.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
