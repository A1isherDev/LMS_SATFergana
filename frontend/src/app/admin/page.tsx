'use client';

import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Settings, Activity, ShieldCheck, Database, Server, FileText } from 'lucide-react';

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Redirect if not admin (double check, though AuthGuard should handle it if we pass role)
    // For now AuthGuard checks login. We'll assume DashboardLayout handles basic role checks visually,
    // but we should probably enforce it here or allow AuthGuard to take a role.
    // existing AuthGuard matches /login if not user.

    if (user && user.role !== 'ADMIN') {
        return (
            <AuthGuard>
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <ShieldCheck className="h-16 w-16 text-red-500 mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                        <p className="text-gray-500 mb-6">You do not have permission to view this page.</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </DashboardLayout>
            </AuthGuard>
        );
    }

    const adminTools = [
        {
            title: 'User Management',
            description: 'Manage students, teachers, and admins. Approve registrations and handle invitations.',
            icon: Users,
            href: '/admin/users',
            color: 'bg-blue-50 text-blue-600',
        },
        {
            title: 'System Configuration',
            description: 'Configure global settings, feature flags, and system-wide preferences.',
            icon: Settings,
            href: '/admin/config',
            color: 'bg-purple-50 text-purple-600',
        },
        {
            title: 'System Analytics',
            description: 'Monitor server health, API usage, and error logs.',
            icon: Activity,
            href: '/analytics/system',
            color: 'bg-green-50 text-green-600',
        },
        {
            title: 'Content Database',
            description: 'Direct access to Question Bank and Flashcard databases.',
            icon: Database,
            href: '/questionbank',
            color: 'bg-orange-50 text-orange-600',
        },
        {
            title: 'Create DSAT Mock Exam',
            description: 'Create a new Digital SAT mock test from the question bank (English 27+27, Math 22+22).',
            icon: FileText,
            href: '/admin/mock-exams/create',
            color: 'bg-indigo-50 text-indigo-600',
        }
    ];

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Administration</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage the LMS platform, users, and system configuration.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {adminTools.map((tool) => (
                            <button
                                key={tool.title}
                                onClick={() => router.push(tool.href)}
                                className="flex flex-col text-left p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
                            >
                                <div className={`p-4 rounded-xl ${tool.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                    <tool.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tool.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{tool.description}</p>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center mb-6">
                                <Server className="h-6 w-6 mr-3 text-blue-400" />
                                <h2 className="text-xl font-bold">System Status</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">API Status</p>
                                    <div className="flex items-center">
                                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                                        <span className="font-semibold">Operational</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Database</p>
                                    <div className="flex items-center">
                                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                                        <span className="font-semibold">Connected</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Last Backup</p>
                                    <span className="font-mono text-sm">2 hours ago</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
