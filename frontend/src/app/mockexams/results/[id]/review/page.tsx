'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    TrendingUp,
    BarChart3,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    XCircle,
    Clock,
    Target,
    Award,
    ArrowLeft,
    Filter,
    Eye,
    Flag,
    BookOpen,
    Loader2,
    Zap
} from 'lucide-react';
import { mockExamsApi } from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { getSatScoreColor } from '@/utils/helpers';

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation: string;
    difficulty: string;
    skill_tag: string;
}

interface AttemptReviewData {
    id: number;
    sat_score: number;
    math_scaled_score: number;
    reading_scaled_score: number;
    writing_scaled_score: number;
    answers: Record<string, Record<string, string>>;
    time_spent_by_section: Record<string, number>;
    mock_exam: {
        id: number;
        title: string;
        math_questions: Question[];
        reading_questions: Question[];
        writing_questions: Question[];
    };
}

const MockExamReviewPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const attemptId = parseInt(params.id as string);

    const [results, setResults] = useState<AttemptReviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'reading' | 'writing' | 'math'>('reading');
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setIsLoading(true);
                const data = await mockExamsApi.getAttemptReview(attemptId) as unknown as AttemptReviewData;
                setResults(data);
                if (data.mock_exam.reading_questions?.length > 0) {
                    setSelectedQuestion(data.mock_exam.reading_questions[0]);
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
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
                    <div className="relative">
                        <div className="h-24 w-24 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Retrieving Archive</p>
                        <p className="text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">Decompressing Response Data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!results) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <BarChart3 className="h-16 w-16 text-slate-200 mx-auto mb-8" />
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter mb-4">Review Unavailable</h1>
                    <p className="text-slate-500 font-medium italic mb-10">We couldn't retrieve the architectural review for this session.</p>
                    <button onClick={() => router.push(`/mockexams/results/${attemptId}`)} className="px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Back to Summary</button>
                </div>
            </DashboardLayout>
        );
    }

    const sectionQuestions = activeSection === 'reading'
        ? results.mock_exam.reading_questions
        : activeSection === 'writing'
            ? results.mock_exam.writing_questions
            : results.mock_exam.math_questions;

    const getStudentAnswer = (questionId: number) => {
        return results.answers[activeSection]?.[questionId.toString()] || null;
    };

    const isCorrect = (question: Question) => {
        const studentAnswer = getStudentAnswer(question.id);
        return studentAnswer === question.correct_answer;
    };

    const filteredQuestions = sectionQuestions.filter(q => {
        if (filter === 'correct') return isCorrect(q);
        if (filter === 'incorrect') return !isCorrect(q) && getStudentAnswer(q.id) !== null;
        return true;
    });

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-7xl mx-auto space-y-12 pb-20">
                    {/* Back Action */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.push(`/mockexams/results/${attemptId}`)}
                            className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all hover:scale-110 flex items-center group"
                        >
                            <ArrowLeft className="h-5 w-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Abort Review</span>
                        </button>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Session ID</span>
                            <p className="text-sm font-black text-slate-900 dark:text-white italic">#ATT-{results.id}-REV</p>
                        </div>
                    </div>

                    {/* Score Summary Header */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 bg-slate-900 dark:bg-slate-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Award className="h-16 w-16" />
                            </div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 leading-none">Consolidated</p>
                            <h2 className="text-5xl font-black italic tracking-tighter leading-none">{results.sat_score}</h2>
                        </div>

                        {[
                            { label: 'Reading Protocol', score: results.reading_scaled_score },
                            { label: 'Writing Section', score: results.writing_scaled_score },
                            { label: 'Math Section', score: results.math_scaled_score }
                        ].map((section, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-700 shadow-sm flex flex-col justify-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">{section.label}</p>
                                <h3 className="text-3xl font-black italic text-slate-900 dark:text-white leading-none">{section.score}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Question Review */}
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-slate-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col min-h-[800px]">
                        {/* Section Tabs */}
                        <div className="flex border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto custom-scrollbar">
                            {['reading', 'writing', 'math'].map((section) => (
                                <button
                                    key={section}
                                    onClick={() => {
                                        setActiveSection(section as any);
                                        const newQuestions = section === 'reading'
                                            ? results.mock_exam.reading_questions
                                            : section === 'writing'
                                                ? results.mock_exam.writing_questions
                                                : results.mock_exam.math_questions;
                                        setSelectedQuestion(newQuestions[0] || null);
                                    }}
                                    className={`flex-shrink-0 px-12 py-8 font-black italic uppercase tracking-widest text-xs transition-all border-b-4 relative ${activeSection === section
                                        ? 'text-blue-600 border-blue-600 bg-white dark:bg-gray-800'
                                        : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {section} Review
                                    {activeSection === section && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-gray-700">
                            {/* Question Sidebar */}
                            <div className="w-full lg:w-96 flex flex-col h-full bg-slate-50/30">
                                <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions</span>
                                    <div className="relative">
                                        <select
                                            value={filter}
                                            onChange={(e) => setFilter(e.target.value as any)}
                                            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-600/10 hover:border-blue-400 transition-colors cursor-pointer"
                                        >
                                            <option value="all">View All</option>
                                            <option value="correct">Correct Only</option>
                                            <option value="incorrect">Incorrect Only</option>
                                        </select>
                                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] lg:max-h-none custom-scrollbar content-start">
                                    {filteredQuestions.map((q, idx) => {
                                        const studentAns = getStudentAnswer(q.id);
                                        const correct = isCorrect(q);

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => setSelectedQuestion(q)}
                                                className={`aspect-square rounded-2xl flex items-center justify-center font-black text-sm relative transition-all ${selectedQuestion?.id === q.id
                                                    ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                                                    : correct
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                        : studentAns === null
                                                            ? 'bg-slate-100 text-slate-400'
                                                            : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Question Detail */}
                            <div className="flex-1 overflow-y-auto p-10 lg:p-14 custom-scrollbar">
                                {selectedQuestion ? (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* status Badge */}
                                        <div className="flex items-center justify-between">
                                            <div className={`flex items-center space-x-3 px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-xs ${isCorrect(selectedQuestion)
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {isCorrect(selectedQuestion) ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                <span>{isCorrect(selectedQuestion) ? 'Correct Answer' : 'Incorrect Answer'}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => router.push(`/questionbank?subject=${encodeURIComponent(selectedQuestion.question_type)}&skill_tag=${encodeURIComponent(selectedQuestion.skill_tag)}`)}
                                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Zap className="h-3 w-3" />
                                                    <span>Practice "{selectedQuestion.skill_tag}"</span>
                                                </button>
                                                <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    <Target className="h-4 w-4 mr-2" />
                                                    <span>{selectedSectionDifficulty(selectedQuestion.difficulty)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Question Content</h4>
                                            <div
                                                className="prose prose-slate prose-xl max-w-none text-slate-900 dark:text-slate-100 leading-relaxed font-medium prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter prose-p:font-medium prose-p:text-slate-600 dark:prose-p:text-slate-300"
                                                dangerouslySetInnerHTML={{ __html: selectedQuestion.question_text }}
                                            />
                                        </div>

                                        {/* Options with selection state */}
                                        <div className="space-y-4 pt-10 border-t border-slate-50">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Answer Review</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {Object.entries(selectedQuestion.options || {}).map(([label, text]) => {
                                                    const isCorrectOpt = label === selectedQuestion.correct_answer;
                                                    const isSelectedOpt = label === getStudentAnswer(selectedQuestion.id);

                                                    return (
                                                        <div
                                                            key={label}
                                                            className={`p-6 rounded-3xl border-2 transition-all flex items-start space-x-4 ${isCorrectOpt
                                                                ? 'bg-emerald-50 border-emerald-600 ring-8 ring-emerald-500/5'
                                                                : isSelectedOpt && !isCorrectOpt
                                                                    ? 'bg-red-50 border-red-600'
                                                                    : 'bg-white border-slate-100'
                                                                }`}
                                                        >
                                                            <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isCorrectOpt ? 'bg-emerald-600 text-white' : isSelectedOpt ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'
                                                                }`}>
                                                                {label}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className={`text-base font-bold ${isCorrectOpt ? 'text-emerald-900' : isSelectedOpt ? 'text-red-900' : 'text-slate-600'}`}>
                                                                    {text}
                                                                </p>
                                                                {isCorrectOpt && (
                                                                    <span className="inline-block mt-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">Correct Solution</span>
                                                                )}
                                                                {isSelectedOpt && !isCorrectOpt && (
                                                                    <span className="inline-block mt-2 text-[10px] font-black text-red-600 uppercase tracking-widest">Your Answer</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Explanation */}
                                        <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
                                            <div className="flex items-center space-x-3 mb-6">
                                                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                                    <Eye className="h-6 w-6" />
                                                </div>
                                                <h5 className="text-xl font-black text-slate-900 italic uppercase tracking-tight">Strategy & Explanation</h5>
                                            </div>
                                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed">
                                                {selectedQuestion.explanation || "No explanation provided for this question."}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-300">
                                        <BookOpen className="h-16 w-16 mb-4 opacity-10" />
                                        <p className="font-bold uppercase tracking-[0.2em] text-xs">Select a question to review</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        height: 4px;
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #e2e8f0;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #cbd5e1;
                    }
                `}</style>
            </DashboardLayout>
        </AuthGuard>
    );
};

const selectedSectionDifficulty = (diff: any) => {
    if (diff === 1) return 'Easy';
    if (diff === 2) return 'Medium';
    if (diff === 3) return 'Hard';
    return diff;
};

export default MockExamReviewPage;
