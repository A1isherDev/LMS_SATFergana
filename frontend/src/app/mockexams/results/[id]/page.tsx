'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    TrendingUp,
    BarChart3,
    CheckCircle,
    XCircle,
    Clock,
    Target,
    Award,
    ArrowLeft,
    Eye,
    FileText
} from 'lucide-react';
import { bluebookApi, mockExamsApi } from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { formatDate, formatDateTime, getSatScoreColor } from '@/utils/helpers';
import { toast } from 'react-hot-toast';

interface QuestionReview {
    id: number;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    selected_answer: string | null;
    is_correct: boolean;
    explanation: string;
    section: string;
}

interface AttemptData {
    id: number;
    mock_exam: {
        id: number;
        title: string;
        description: string;
        exam_type: string;
    };
    started_at: string;
    submitted_at: string;
    sat_score: number;
    math_scaled_score: number;
    reading_scaled_score: number;
    writing_scaled_score: number;
    math_raw_score: number;
    reading_raw_score: number;
    writing_raw_score: number;
    total_raw_score: number;
    is_completed: boolean;
    // We might need to fetch detailed question review separately or include it in detail serializer
    review_data?: QuestionReview[];
}

export default function MockExamResultsPage() {
    const params = useParams();
    const router = useRouter();
    const attemptId = parseInt(params.id as string);

    const [attempt, setAttempt] = useState<AttemptData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionReview | null>(null);
    const [activeSection, setActiveSection] = useState<'math' | 'reading' | 'writing'>('reading');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setIsLoading(true);
                // The attempt details should ideally include question-level review
                // If not, we might need a specific endpoint for it
                const data: any = await mockExamsApi.getMyAttempts(); // This gets all, we need specific
                const specificAttempt = data.find((a: any) => a.id === attemptId);

                if (specificAttempt) {
                    setAttempt(specificAttempt);
                    // For now, if review_data is missing, we'll mock it or use dummy
                    // In a real system, the detail serializer would include this
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [attemptId]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!attempt) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <BarChart3 className="h-16 w-16 text-slate-200 mx-auto mb-8" />
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-4">Results Not Found</h1>
                    <p className="text-slate-500 font-medium italic mb-10">We couldn't find the results for this exam attempt.</p>
                    <button onClick={() => router.push('/mockexams')} className="px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Back to Exams</button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-7xl mx-auto space-y-12 pb-20">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex items-start space-x-6">
                            <button
                                onClick={() => router.push('/mockexams')}
                                className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all hover:scale-110"
                                title="Back to Exams"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Test Results</span>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Exam Results</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">{attempt.mock_exam.title}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Submission Time</span>
                            <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight">{formatDateTime(attempt.submitted_at)}</p>
                        </div>
                    </div>

                    {/* score Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 bg-slate-900 dark:bg-slate-700 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                                <Award className="h-48 w-48 text-blue-600" />
                            </div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 relative z-10">Consolidated SAT</p>
                            <h2 className={`text-7xl font-black italic tracking-tighter relative z-10 ${getSatScoreColor(attempt.sat_score)}`}>{attempt.sat_score}</h2>
                            <div className="mt-10 flex items-center space-x-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                <span>Performance Peak</span>
                            </div>
                        </div>

                        {[
                            { label: 'Math Section', score: attempt.math_scaled_score, raw: attempt.math_raw_score, color: 'bg-blue-600' },
                            { label: 'Reading Protocol', score: attempt.reading_scaled_score, raw: attempt.reading_raw_score, color: 'bg-emerald-600' },
                            { label: 'Writing Section', score: attempt.writing_scaled_score, raw: attempt.writing_raw_score, color: 'bg-purple-600' }
                        ].map((section, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 border border-slate-100 dark:border-gray-700 shadow-sm flex flex-col justify-between group hover:border-blue-400 transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{section.label}</p>
                                    <h3 className="text-4xl font-black italic text-slate-900 dark:text-white tracking-tighter">{section.score || '---'}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Raw Points: {section.raw}</p>
                                </div>
                                <div className="mt-8 space-y-3">
                                    <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase">
                                        <span>Accuracy</span>
                                        <span>{section.score ? Math.round(((section.score - 200) / 600) * 100) : 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden shadow-inner">
                                        <div className={`${section.color} h-full rounded-full transition-all duration-1000 group-hover:scale-x-105 origin-left`} style={{ width: `${((section.score || 200) - 200) / 6}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Section Analysis Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-slate-100 dark:border-gray-700 shadow-sm p-12 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                            <Target className="h-64 w-64" />
                        </div>
                        <div className="flex items-center space-x-6 mb-12 relative z-10">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-3xl">
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Performance Analysis</h3>
                                <p className="text-slate-500 font-medium italic">High-fidelity section granularity analysis</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            {[
                                { label: 'Mathematics', raw: attempt.math_raw_score, focus: 'Algebra & Geometry', border: 'hover:border-blue-400' },
                                { label: 'Reading Ops', raw: attempt.reading_raw_score, focus: 'Context Clues', border: 'hover:border-emerald-400' },
                                { label: 'Writing Protocol', raw: attempt.writing_raw_score, focus: 'Punctuation', border: 'hover:border-purple-400' }
                            ].map((item, idx) => (
                                <div key={idx} className={`p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group ${item.border} transition-all`}>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{item.label}</h4>
                                    <div className="flex items-end justify-between mb-8">
                                        <div className="text-5xl font-black italic text-slate-900 dark:text-white tracking-tighter">{item.raw}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Acquired</div>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest italic group-hover:text-blue-600 transition-colors">
                                        Priority: {item.focus}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 flex justify-center relative z-10">
                            <button
                                onClick={() => {
                                    router.push(`/mockexams/results/${attemptId}/review`);
                                    toast.success("Initializing individual question scan...");
                                }}
                                className="flex items-center space-x-4 px-12 py-5 bg-slate-900 dark:bg-slate-700 text-white rounded-[1.5rem] font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl shadow-blue-900/20 group"
                            >
                                <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span>Execute Deep Question Review</span>
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
