'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { classesApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import {
    Calendar,
    Clock,
    Users
} from 'lucide-react';

interface ClassSummary {
    id: number;
    name: string;
    schedule_config: {
        days: string[];
        time: string;
        duration_minutes?: number;
    };
    current_student_count: number;
    max_students: number;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function SchedulePage() {
    const [classes, setClasses] = useState<ClassSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await classesApi.getClasses();
            // Cast response to unknown then to ClassSummary[] because api returns generic type
            const classList = (Array.isArray(response) ? response : (response as any).results || []) as ClassSummary[];
            setClasses(classList);
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    const getDayClasses = (day: string) => {
        return classes
            .filter(cls => cls.schedule_config?.days?.includes(day))
            .sort((a, b) => (a.schedule_config?.time || '').localeCompare(b.schedule_config?.time || ''));
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <AuthGuard requireAuth={true}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Overview of your class times and sessions
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={() => toast.success('Calendar integration coming soon!')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Sync Calendar
                            </button>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                        {DAYS.map((day) => {
                            const dayClasses = getDayClasses(day);
                            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() === day;

                            return (
                                <div key={day} className={`p-6 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                                    <div className="flex items-start">
                                        <div className={`w-16 flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-lg ${isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                            <span className="text-sm font-bold">{day}</span>
                                        </div>

                                        <div className="ml-6 flex-1 space-y-4">
                                            {dayClasses.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic py-2">No classes scheduled</p>
                                            ) : (
                                                dayClasses.map((cls) => (
                                                    <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <Clock className="flex-shrink-0 h-5 w-5 text-gray-400 mr-1.5" />
                                                                <span className="font-medium text-gray-900">{cls.schedule_config?.time || 'TBA'}</span>
                                                                <span className="mx-2 text-gray-300">|</span>
                                                                <span>{cls.schedule_config?.duration_minutes || 60} min</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-900">{cls.name}</h4>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 sm:mt-0 flex items-center text-sm text-gray-500">
                                                            <Users className="flex-shrink-0 h-5 w-5 text-gray-400 mr-1.5" />
                                                            <span>{cls.current_student_count} / {cls.max_students} Students</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
