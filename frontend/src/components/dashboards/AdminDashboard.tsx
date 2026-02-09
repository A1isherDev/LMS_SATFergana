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
    AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { analyticsApi } from '@/utils/api';

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

export default function AdminDashboard({ stats }: AdminDashboardProps) {
    const router = useRouter();
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

    useEffect(() => {
        const fetchSystemHealth = async () => {
            try {
                const health = await analyticsApi.getSystemHealth() as SystemHealth;
                setSystemHealth(health);
            } catch (error) {
                console.error('Error fetching system health:', error);
            }
        };

        fetchSystemHealth();
    }, []);

    const metrics = [
        { label: 'Total Users', value: stats.totalUsers, icon: <Users className="text-blue-600" />, bg: 'bg-blue-50' },
        { label: 'Active Students', value: stats.totalStudents, icon: <Activity className="text-green-600" />, bg: 'bg-green-50' },
        { label: 'Staff/Teachers', value: stats.totalTeachers, icon: <ShieldCheck className="text-purple-600" />, bg: 'bg-purple-50' },
        { label: 'Today\'s Sessions', value: stats.todaySessions, icon: <Clock className="text-orange-600" />, bg: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8">
            {/* Admin Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center space-x-4">
                        <div className={`p-4 rounded-xl ${m.bg} dark:bg-opacity-10`}>
                            {m.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
                            <p className="text-2xl font-bold text-foreground">{m.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health / Content Stats */}
                <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-foreground flex items-center">
                            <Database className="mr-3 text-muted-foreground opacity-50" />
                            Content Repository Status
                        </h3>
                        <button
                            onClick={() => router.push('/admin')}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                        >
                            System Admin &rarr;
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-500/5 rounded-2xl border border-slate-500/10">
                            <p className="text-sm text-slate-500 mb-1">SAT Questions</p>
                            <p className="text-3xl font-black text-foreground">{stats.totalQuestions}</p>
                            <div className="mt-4 h-1.5 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                            <p className="text-sm text-emerald-600 mb-1">Flashcards</p>
                            <p className="text-3xl font-black text-foreground">{stats.totalFlashcards}</p>
                            <div className="mt-4 h-1.5 w-full bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                            <p className="text-sm text-blue-600 mb-1">Homework Sets</p>
                            <p className="text-3xl font-black text-foreground">{stats.totalHomework}</p>
                            <div className="mt-4 h-1.5 w-full bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* System Health Indicators */}
                    {systemHealth && (
                        <div className="mt-8 pt-8 border-t border-border">
                            <h4 className="text-lg font-semibold text-foreground mb-4">System Health</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    {systemHealth.api_status === 'operational' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        API: <span className="font-medium text-foreground capitalize">{systemHealth.api_status}</span>
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {systemHealth.database_status === 'healthy' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        Database: <span className="font-medium text-foreground capitalize">{systemHealth.database_status}</span>
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {systemHealth.ssl_valid ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-orange-500" />
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                        SSL: <span className="font-medium text-foreground">{systemHealth.ssl_expiry_days} days</span>
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    <span className="text-sm text-muted-foreground">
                                        Active (24h): <span className="font-medium text-foreground">{systemHealth.active_users_24h}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Admin Quick Actions */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
                        <Settings className="mr-3 text-muted-foreground opacity-50" />
                        Admin Tools
                    </h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/admin/users')}
                            className="group w-full flex items-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all border border-blue-100 dark:border-blue-900/30"
                        >
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">User Management</span>
                        </button>
                        <button
                            onClick={() => router.push('/admin/config')}
                            className="group w-full flex items-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all border border-purple-100 dark:border-purple-900/30"
                        >
                            <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                            <span className="text-sm font-medium text-purple-900 dark:text-purple-200">System Configuration</span>
                        </button>
                        <button
                            onClick={() => router.push('/analytics/system')}
                            className="group w-full flex items-center p-4 bg-green-50 dark:bg-green-900/10 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/20 transition-all border border-green-100 dark:border-green-900/30"
                        >
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                            <span className="text-sm font-medium text-green-900 dark:text-green-200">System Logs</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
