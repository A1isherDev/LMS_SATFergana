'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    TrendingUp,
    BarChart3,
    CheckCircle,
    Clock,
    Target,
    Award,
    ArrowLeft,
    Mail,
    Calendar,
    BookOpen,
    PieChart,
    Activity,
    AlertCircle
} from 'lucide-react';
import { analyticsApi, classesApi, homeworkApi } from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { formatPercentage, formatDuration, formatDate } from '@/utils/helpers';

interface WeakArea {
    area_type: string;
    subcategory: string;
    weakness_score: number;
    accuracy_rate: number;
    question_count: number;
    improvement_suggestion: string;
}

interface ProgressRecord {
    date: string;
    sat_score: number;
    homework_accuracy: number;
    study_time_minutes: number;
}

interface StudentDetailData {
    student_id: number;
    student_name: string;
    student_email: string;
    current_sat_score: number;
    target_sat_score: number;
    score_gap: number;
    homework_completion_rate: number;
    homework_accuracy: number;
    flashcard_mastery_rate: number;
    study_streak: number;
    total_study_time: number;
    weak_areas: WeakArea[];
    recent_progress: ProgressRecord[];
}

const StudentDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const classId = parseInt(params.id as string);
    const studentId = parseInt(params.studentId as string);

    const [studentData, setStudentData] = useState<any | null>(null);
    const [classDetail, setClassDetail] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                // Fetch student summary (assuming teacher/admin can access with student_id param)
                // We'll update the API utility and backend to support this
                const summary = await analyticsApi.getStudentSummaryById(studentId);
                setStudentData(summary);

                const cls = await classesApi.getClass(classId);
                setClassDetail(cls);
            } catch (error) {
                console.error('Error fetching student detail:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [studentId, classId]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!studentData) {
        return (
            <DashboardLayout>
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <AlertCircle className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-slate-900 italic uppercase">Student Not Found</h1>
                    <p className="text-slate-500 mt-2">We couldn't find the details for this student.</p>
                    <button onClick={() => router.push(`/classes/${classId}`)} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold">Back to Class</button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="space-y-8 pb-12">
                    {/* Header & Back Action */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <button
                                onClick={() => router.push(`/classes/${classId}`)}
                                className="flex items-center text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] transition-colors mb-4"
                            >
                                <ArrowLeft className="h-3 w-3 mr-2" />
                                Back to {classDetail?.name || 'Class'}
                            </button>
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-2xl font-black italic">
                                    {studentData.student_name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tight">{studentData.student_name}</h1>
                                    <div className="flex items-center space-x-4 text-slate-500 mt-1">
                                        <span className="flex items-center text-xs font-bold"><Mail className="h-3 w-3 mr-1.5" /> {studentData.student_email}</span>
                                        <span className="h-1 w-1 bg-slate-300 rounded-full" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600">ID: #{studentData.student_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                                Send Message
                            </button>
                            <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all">
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Award className="h-16 w-16" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current SAT Score</p>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-4xl font-black text-slate-900 italic">{studentData.current_sat_score}</p>
                                <span className="text-xs font-bold text-slate-400">/ 1600</span>
                            </div>
                            <div className="mt-4 flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                <span>+40 pts this month</span>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Homework Accuracy</p>
                            <p className="text-4xl font-black text-slate-900 italic">{formatPercentage(studentData.homework_accuracy)}</p>
                            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                                <div className="bg-indigo-600 h-full" style={{ width: `${studentData.homework_accuracy}%` }} />
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Study Streak</p>
                            <p className="text-4xl font-black text-slate-900 italic">{studentData.study_streak} Days</p>
                            <div className="mt-4 flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                <Activity className="h-3 w-3 mr-1" />
                                <span>Active Today</span>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Gap</p>
                            <p className="text-4xl font-black text-red-600 italic">-{studentData.score_gap}</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">Goal: {studentData.target_sat_score}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Progress Chart & History */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 italic uppercase">Progress Trend</h3>
                                    </div>
                                    <div className="flex bg-slate-50 p-1 rounded-xl">
                                        <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 rounded-lg shadow-sm">30 Days</button>
                                        <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">90 Days</button>
                                    </div>
                                </div>

                                <div className="h-64 flex items-end justify-between space-x-4">
                                    {studentData.recent_progress.map((p: ProgressRecord, i: number) => (
                                        <div key={i} className="flex-1 flex flex-col items-center group">
                                            <div className="w-full relative flex flex-col items-center">
                                                <div
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-t-lg group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all cursor-pointer"
                                                    style={{ height: `${(p.sat_score / 1600) * 200}px` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {p.sat_score}
                                                    </div>
                                                </div>
                                                <div
                                                    className="w-full bg-blue-600/20 rounded-t-lg absolute bottom-0 opacity-50 group-hover:bg-blue-600/40"
                                                    style={{ height: `${(p.homework_accuracy / 100) * 150}px` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                                                {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                                <div className="flex items-center space-x-3 mb-8">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 italic uppercase">Recent Activity</h3>
                                </div>

                                <div className="space-y-4">
                                    {studentData.recent_progress.slice().reverse().slice(0, 5).map((activity: ProgressRecord, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-6 rounded-3xl border border-slate-50 hover:bg-slate-50/50 transition-all">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center">
                                                    <BookOpen className="h-6 w-6 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase">SAT Practice session</p>
                                                    <p className="text-xs font-bold text-slate-400">{formatDuration(activity.study_time_minutes)} • {formatDate(activity.date)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-indigo-600">{activity.sat_score} Score</p>
                                                <p className="text-[10px] font-black text-slate-300 uppercase italic">Verified</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Weak Areas & Profile */}
                        <div className="space-y-8 text-foreground">
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                                <div className="flex items-center space-x-3 mb-8">
                                    <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white">
                                        <PieChart className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase">Weak Areas</h3>
                                </div>

                                <div className="space-y-6">
                                    {studentData.weak_areas.map((area: WeakArea, i: number) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{area.area_type}</p>
                                                    <p className="text-sm font-bold">{area.subcategory}</p>
                                                </div>
                                                <span className="text-xs font-black text-red-400">{formatPercentage(area.accuracy_rate)} Acc.</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-red-500 h-full rounded-full"
                                                    style={{ width: `${area.accuracy_rate}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                                "{area.improvement_suggestion}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Personal Info</h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                        <p className="text-sm font-bold text-slate-900">{studentData.student_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Level</p>
                                        <p className="text-sm font-bold text-slate-900">11th Grade</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SAT Exam Date</p>
                                        <p className="text-sm font-bold text-slate-900">March 24, 2026</p>
                                    </div>
                                </div>
                                <button className="w-full mt-10 py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all">
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
};

export default StudentDetailPage;
