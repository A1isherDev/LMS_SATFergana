'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserIcon, Lock, Bell, Palette, Globe, Settings, Save, Check, Shield, Mail, Smartphone } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usersApi, authApi } from '@/utils/api';
import { toast } from 'react-hot-toast';

const ROLE_DISPLAY: Record<string, string> = {
    'ADMIN': 'Administrator',
    'MAIN_TEACHER': 'Main Teacher',
    'SUPPORT_TEACHER': 'Support Teacher',
    'STUDENT': 'Student'
};

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [activeSection, setActiveSection] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        phone_number: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                bio: user.bio || '',
                phone_number: user.phone_number || ''
            });
        }
    }, [user]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await authApi.updateProfile(formData);
            await refreshUser();
            toast.success('Profile Synced Successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Sync Failed');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-6xl mx-auto space-y-12 pb-20">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">System Configuration</span>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Control Center</h1>
                        </div>
                        {user && (
                            <div className="px-6 py-3 bg-slate-900 dark:bg-blue-600 rounded-2xl">
                                <span className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">
                                    {ROLE_DISPLAY[user.role as string] || user.role} Tier
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1 space-y-3">
                            {[
                                { id: 'profile', label: 'Identity', icon: UserIcon },
                                { id: 'security', label: 'Protection', icon: Lock },
                                { id: 'notifications', label: 'Broadcasts', icon: Bell },
                                { id: 'appearance', label: 'Interface', icon: Palette },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center px-6 py-4 rounded-2xl transition-all ${activeSection === item.id
                                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xl shadow-slate-900/10'
                                        : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <item.icon className={`h-4 w-4 mr-4 ${activeSection === item.id ? 'text-blue-400 dark:text-blue-100' : 'text-slate-400'}`} />
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${activeSection === item.id ? 'italic' : ''}`}>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-10">
                                    {activeSection === 'profile' && (
                                        <form onSubmit={handleProfileSubmit} className="space-y-12">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Identity Management</h2>
                                                <div className="h-1 w-12 bg-blue-600 rounded-full opacity-20"></div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="h-24 w-24 rounded-[2rem] bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white text-3xl font-black italic shadow-2xl">
                                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                                </div>
                                                <div className="space-y-3">
                                                    <button type="button" className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-slate-600 dark:text-slate-300">
                                                        Update Avatar
                                                    </button>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SVG, PNG, or JPG (MAX. 500X500PX)</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First ID Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.first_name}
                                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last ID Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.last_name}
                                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Verified Gateway (Email)</label>
                                                    <input
                                                        type="email"
                                                        defaultValue={user?.email}
                                                        disabled
                                                        className="w-full px-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 border-none rounded-2xl text-slate-400 cursor-not-allowed font-bold italic"
                                                    />
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase italic tracking-tight">Locked for security purposes.</p>
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">About Me (Bio)</label>
                                                    <textarea
                                                        rows={4}
                                                        value={formData.bio}
                                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-slate-900 dark:text-white resize-none"
                                                        placeholder="Define your educational objectives..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-8 border-t border-slate-50 dark:border-gray-700/50">
                                                <button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="flex items-center px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                                                >
                                                    {isSaving ? <Settings className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Synchronize Profile
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {activeSection === 'appearance' && (
                                        <div className="space-y-12">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Interface Design</h2>
                                                <div className="h-1 w-12 bg-blue-600 rounded-full opacity-20"></div>
                                            </div>

                                            <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Aesthetic Mode</h3>
                                                        <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase italic mt-1">Select your preferred visualization tier</p>
                                                    </div>
                                                    <ThemeToggle />
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Theme Options</h3>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <button className="flex flex-col items-start p-8 rounded-2xl border-2 border-slate-900 bg-slate-900 transition-all hover:scale-105 shadow-xl">
                                                        <div className="w-full h-20 bg-slate-800 rounded-xl mb-4 flex items-center justify-center border border-slate-700">
                                                            <div className="text-white text-sm font-black uppercase italic">Dark</div>
                                                        </div>
                                                        <span className="block text-xs font-black uppercase text-white tracking-widest mb-2">Dark Theme</span>
                                                        <span className="block text-[9px] text-slate-400 font-medium">White text on dark background</span>
                                                    </button>
                                                    <button className="flex flex-col items-start p-8 rounded-2xl border-2 border-slate-200 bg-white transition-all hover:scale-105 shadow-xl">
                                                        <div className="w-full h-20 bg-slate-50 rounded-xl mb-4 flex items-center justify-center border border-slate-200">
                                                            <div className="text-slate-900 text-sm font-black uppercase italic">Light</div>
                                                        </div>
                                                        <span className="block text-xs font-black uppercase text-slate-900 tracking-widest mb-2">White Theme</span>
                                                        <span className="block text-[9px] text-slate-500 font-medium">Black text on white background</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeSection === 'security' && (
                                        <div className="space-y-12">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Security Protocols</h2>
                                                <div className="h-1 w-12 bg-blue-600 rounded-full opacity-20"></div>
                                            </div>

                                            <div className="space-y-6">
                                                <button className="w-full text-left p-8 rounded-[2rem] border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all flex justify-between items-center group">
                                                    <div className="flex items-center">
                                                        <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 mr-6">
                                                            <Shield className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Multi-Factor Access</h3>
                                                            <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold italic mt-1 uppercase">Enhanced account protection sequence</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Deactivated</div>
                                                </button>

                                                <button className="w-full text-left p-8 rounded-[2rem] border border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all flex justify-between items-center group">
                                                    <div className="flex items-center">
                                                        <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mr-6">
                                                            <Lock className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Credential Reset</h3>
                                                            <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold italic mt-1 uppercase">Modify secure authentication token</p>
                                                        </div>
                                                    </div>
                                                    <Settings className="h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeSection === 'notifications' && (
                                        <div className="space-y-12">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Signal Management</h2>
                                                <div className="h-1 w-12 bg-blue-600 rounded-full opacity-20"></div>
                                            </div>

                                            <div className="space-y-6">
                                                {[
                                                    { icon: Mail, title: 'Electronic Mail', desc: 'Sync homework alerts and exam analytics', color: 'text-blue-600' },
                                                    { icon: Smartphone, title: 'In-App Signals', desc: 'Live system updates and leaderboard alerts', color: 'text-purple-600' }
                                                ].map((signal, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-gray-700">
                                                        <div className="flex items-center">
                                                            <signal.icon className={`h-6 w-6 mr-6 ${signal.color}`} />
                                                            <div>
                                                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{signal.title}</h3>
                                                                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-bold italic mt-1 uppercase">{signal.desc}</p>
                                                            </div>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" defaultChecked={idx === 0} />
                                                            <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
