'use client';

import React from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
    GraduationCap,
    BookOpen,
    Calendar
} from 'lucide-react';

export default function TeacherDashboard() {
    const features = [
        {
            name: 'Gradebook',
            description: 'View and manage student grades across all assignments.',
            href: '/teachers/gradebook',
            icon: GraduationCap,
            color: 'bg-blue-50 text-blue-700',
        },
        {
            name: 'Class Resources',
            description: 'Upload and manage study materials for your classes.',
            href: '/teachers/resources',
            icon: BookOpen,
            color: 'bg-purple-50 text-purple-700',
        },
        {
            name: 'Schedule',
            description: 'View your weekly class schedule and sessions.',
            href: '/teachers/schedule',
            icon: Calendar,
            color: 'bg-green-50 text-green-700',
        },
    ];

    return (
        <AuthGuard requireAuth={true}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage your classes, students, and resources
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <Link key={feature.name} href={feature.href} className="block group">
                                <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow h-full">
                                    <div className={`inline-flex items-center justify-center rounded-lg p-3 ${feature.color}`}>
                                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {feature.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {feature.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
