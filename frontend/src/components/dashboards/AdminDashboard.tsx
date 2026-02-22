import React, { useState, useEffect } from 'react';
import {
    Users,
    Settings,
    Database,
    TrendingUp,
    Activity,
    Clock,
    Smartphone,
    ShieldCheck,
    Layout,
    CheckCircle,
    AlertCircle,
    Server,
    Zap,
    Cpu,
    HardDrive,
    Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi, analyticsApi } from '@/utils/api';

interface AdminDashboardProps {
    stats: {
        totalUsers: number;
        totalStudents: number;
        totalTeachers: number;
        totalHomework: number;
        totalQuestions: number;
        totalFlashcards: number;
        todaySessions: number;
        weeklySessions: number;
    };
}

interface SystemHealth {
    api_status: string;
    database_status: string;
    ssl_valid: boolean;
    ssl_expiry_days: number;
    active_users_24h: number;
    error_count_24h: number;
}

interface SystemStats {
    cpu_usage: number;
    memory_usage: number;
    active_connections: number;
    db_latency_ms: number;
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
    const router = useRouter();
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [health, sStats] = await Promise.all([
                    analyticsApi.getSystemHealth() as Promise<SystemHealth>,
                    adminApi.getSystemStats() as Promise<SystemStats>
                ]);
                setSystemHealth(health);
                setSystemStats(sStats);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const metrics = [
        { label: 'Total Users', value: stats.totalUsers, icon: <Users className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-50' },
        { label: 'Active Students', value: stats.totalStudents, icon: <Activity className="h-6 w-6 text-emerald-600" />, bg: 'bg-emerald-50' },
        { label: 'Staff/Teachers', value: stats.totalTeachers, icon: <ShieldCheck className="h-6 w-6 text-purple-600" />, bg: 'bg-purple-50' },
        { label: 'CPU Usage', value: systemStats ? `${systemStats.cpu_usage}%` : '...', icon: <Cpu className="h-6 w-6 text-orange-600" />, bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Admin Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 flex items-center space-x-6 group hover:border-blue-400 transition-all">
                        <div className={`p-4 rounded-3xl ${m.bg} dark:bg-opacity-10 shadow-sm transition-transform group-hover:scale-110`}>
                            {m.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">{m.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health / Content Repository */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic flex items-center">
                                <HardDrive className="mr-3 text-blue-600 h-5 w-5" />
                                Content Repository Status
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live data from the production database</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/config')}
                            className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 hover:scale-105 transition-all"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="p-8 bg-slate-50 dark:bg-gray-700/50 rounded-[2rem] border border-slate-100 dark:border-gray-600 group hover:bg-white transition-all shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SAT Questions</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">{stats.totalQuestions}</p>
                            <div className="mt-6 h-1.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-900 dark:bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/20 group hover:bg-white transition-all shadow-sm">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Flashcards</p>
                            <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400 italic tracking-tighter leading-none">{stats.totalFlashcards}</p>
                            <div className="mt-6 h-1.5 w-full bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-800/20 group hover:bg-white transition-all shadow-sm">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Homework Sets</p>
                            <p className="text-4xl font-black text-blue-700 dark:text-blue-400 italic tracking-tighter leading-none">{stats.totalHomework}</p>
                            <div className="mt-6 h-1.5 w-full bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* System Health Indicators */}
                    {systemHealth && (
                        <div className="mt-12 pt-8 border-t border-slate-50 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic flex items-center">
                                    <Activity className="h-4 w-4 mr-2 text-emerald-500" />
                                    Real-time System Health
                                </h4>
                                <div className="flex space-x-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase italic">All Systems Operational</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col p-4 bg-slate-50 dark:bg-gray-700/30 rounded-2xl border border-slate-100 dark:border-gray-600">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">API Cluster</span>
                                    <div className="flex items-center">
                                        {systemHealth.api_status === 'operational' ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                        )}
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{systemHealth.api_status}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col p-4 bg-slate-50 dark:bg-gray-700/30 rounded-2xl border border-slate-100 dark:border-gray-600">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">DB Engine</span>
                                    <div className="flex items-center">
                                        {systemHealth.database_status === 'healthy' ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                        )}
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{systemHealth.database_status}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col p-4 bg-slate-50 dark:bg-gray-700/30 rounded-2xl border border-slate-100 dark:border-gray-600">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">SSL Shield</span>
                                    <div className="flex items-center">
                                        {systemHealth.ssl_valid ? (
                                            <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                                        )}
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{systemHealth.ssl_expiry_days}d Left</span>
                                    </div>
                                </div>

                                <div className="flex flex-col p-4 bg-slate-50 dark:bg-gray-700/30 rounded-2xl border border-slate-100 dark:border-gray-600">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Traffic (24h)</span>
                                    <div className="flex items-center">
                                        <Globe className="h-4 w-4 text-purple-500 mr-2" />
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{systemHealth.active_users_24h} Reqs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Admin Quick Actions */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200">
                    <h3 className="text-xl font-black text-white uppercase italic mb-8 flex items-center">
                        <Zap className="mr-3 text-blue-400 h-5 w-5" />
                        Admin Pulse
                    </h3>
                    <div className="space-y-4">
                        <button
                            onClick={() => router.push('/admin/users')}
                            className="group w-full flex items-center p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/5 shadow-sm"
                        >
                            <div className="p-3 bg-white/10 rounded-xl group-hover:bg-blue-500 transition-all mr-4">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">User Directory</p>
                                <p className="text-[9px] text-white/50 font-bold uppercase tracking-tighter italic">Permissions & Bans</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/admin/config')}
                            className="group w-full flex items-center p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/5 shadow-sm"
                        >
                            <div className="p-3 bg-white/10 rounded-xl group-hover:bg-purple-500 transition-all mr-4">
                                <Settings className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Global Settings</p>
                                <p className="text-[9px] text-white/50 font-bold uppercase tracking-tighter italic">API Keys & Logic</p>
                            </div>
                        </button>

                        <button
                            onClick={() => router.push('/analytics/system')}
                            className="group w-full flex items-center p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/5 shadow-sm"
                        >
                            <div className="p-3 bg-white/10 rounded-xl group-hover:bg-emerald-500 transition-all mr-4">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">System Logs</p>
                                <p className="text-[9px] text-white/50 font-bold uppercase tracking-tighter italic">Traffic Analysis</p>
                            </div>
                        </button>
                    </div>

                    <div className="mt-12 space-y-6">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/10 pb-2">Hardware Usage</p>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase italic">
                                <span className="text-white/60 flex items-center"><Cpu className="h-3 w-3 mr-1" /> Unit A (CPU)</span>
                                <span className="text-blue-400">{systemStats ? `${systemStats.cpu_usage}%` : '0%'}</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: systemStats ? `${systemStats.cpu_usage}%` : '0%' }}></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase italic">
                                <span className="text-white/60 flex items-center"><HardDrive className="h-3 w-3 mr-1" /> Cache Unit</span>
                                <span className="text-purple-400">{systemStats ? `${systemStats.memory_usage}%` : '0%'}</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: systemStats ? `${systemStats.memory_usage}%` : '0%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
