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
    Flag
} from 'lucide-react';
import { bluebookApi } from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';

interface QuestionReview {
    id: number;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    selected_answer: string | null;
    is_correct: boolean;
    explanation: string;
    is_flagged: boolean;
}

interface ModuleReview {
    id: number;
    title: string;
    section: string;
    questions: QuestionReview[];
    score: number;
    max_score: number;
}

interface ResultsData {
    id: number;
    total_score: number;
    reading_writing_score: number;
    math_score: number;
    status: string;
    completed_at: string;
    modules: ModuleReview[];
}

const DigitalSATResultsPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const attemptId = parseInt(params.id as string);

    const [results, setResults] = useState<ResultsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeModuleIndex, setActiveModuleIndex] = useState(0);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionReview | null>(null);
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'flagged'>('all');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setIsLoading(true);
                const data = await bluebookApi.getResults(attemptId) as ResultsData;
                setResults(data);
                if (data.modules?.length > 0) {
                    setSelectedQuestion(data.modules[0].questions[0]);
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
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!results) {
        return (
            <DashboardLayout>
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <BarChart3 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-slate-900 italic uppercase">Results Not Available</h1>
                    <p className="text-slate-500 mt-2">We couldn't find the results for this exam attempt.</p>
                    <button onClick={() => router.push('/mockexams/bluebook')} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold">Back to Dashboard</button>
                </div>
            </DashboardLayout>
        );
    }

    const activeModule = results.modules[activeModuleIndex];
    const filteredQuestions = activeModule?.questions.filter(q => {
        if (filter === 'correct') return q.is_correct;
        if (filter === 'incorrect') return !q.is_correct;
        if (filter === 'flagged') return q.is_flagged;
        return true;
    }) || [];

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="space-y-8 pb-12">
                    {/* Back Action */}
                    <button
                        onClick={() => router.push('/mockexams/bluebook')}
                        className="flex items-center text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </button>

                    {/* score Summary Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Award className="h-24 w-24" />
                            </div>
                            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-2 leading-none">Total Performance</p>
                            <h2 className="text-6xl font-black italic tracking-tighter leading-none">{results.total_score}</h2>
                            <div className="mt-8 flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span>Top 5% Globally</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Reading & Writing</p>
                                <h3 className="text-4xl font-black italic text-slate-900 leading-none">{results.reading_writing_score}</h3>
                            </div>
                            <div className="w-full bg-slate-50 h-3 rounded-full mt-6 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(results.reading_writing_score / 800) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Mathematics</p>
                                <h3 className="text-4xl font-black italic text-slate-900 leading-none">{results.math_score}</h3>
                            </div>
                            <div className="w-full bg-slate-50 h-3 rounded-full mt-6 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(results.math_score / 800) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Question Review */}
                    <div className="bg-white rounded-[2.75rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
                        {/* Section Tabs */}
                        <div className="flex border-b border-slate-50 overflow-x-auto custom-scrollbar">
                            {results.modules.map((mod, idx) => (
                                <button
                                    key={mod.id}
                                    onClick={() => {
                                        setActiveModuleIndex(idx);
                                        setSelectedQuestion(mod.questions[0]);
                                    }}
                                    className={`flex-shrink-0 px-10 py-6 font-black italic uppercase tracking-tight text-sm transition-all border-b-4 ${activeModuleIndex === idx
                                            ? 'bg-slate-50 text-slate-900 border-blue-600'
                                            : 'text-slate-300 border-transparent hover:text-slate-500'
                                        }`}
                                >
                                    {mod.section} - {mod.title}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-50">
                            {/* Question Sidebar */}
                            <div className="w-full lg:w-96 flex flex-col h-full bg-slate-50/30">
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Question List</span>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value as any)}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-600/10"
                                    >
                                        <option value="all">All Questions</option>
                                        <option value="correct">Correct Only</option>
                                        <option value="incorrect">Incorrect Only</option>
                                        <option value="flagged">Flagged Only</option>
                                    </select>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] lg:max-h-none custom-scrollbar content-start">
                                    {filteredQuestions.map((q, idx) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setSelectedQuestion(q)}
                                            className={`aspect-square rounded-2xl flex items-center justify-center font-black text-sm relative transition-all ${selectedQuestion?.id === q.id
                                                    ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                                                    : q.is_correct
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                        : q.selected_answer === null
                                                            ? 'bg-slate-100 text-slate-400'
                                                            : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                                }`}
                                        >
                                            {idx + 1}
                                            {q.is_flagged && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Detail */}
                            <div className="flex-1 overflow-y-auto p-10 lg:p-14 custom-scrollbar">
                                {selectedQuestion ? (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* status Badge */}
                                        <div className="flex items-center justify-between">
                                            <div className={`flex items-center space-x-3 px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-xs ${selectedQuestion.is_correct
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {selectedQuestion.is_correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                <span>{selectedQuestion.is_correct ? 'Correct Answer' : 'Incorrect Answer'}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    <span>42s taken</span>
                                                </div>
                                                <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    <Target className="h-4 w-4 mr-2" />
                                                    <span>Med Difficulty</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Question Content</h4>
                                            <div
                                                className="prose prose-slate prose-xl max-w-none text-slate-900 leading-relaxed font-medium"
                                                dangerouslySetInnerHTML={{ __html: selectedQuestion.question_text }}
                                            />
                                        </div>

                                        {/* Options with selection state */}
                                        <div className="space-y-4 pt-10 border-t border-slate-50">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Answer Review</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedQuestion.options.map((option, idx) => {
                                                    const label = String.fromCharCode(65 + idx);
                                                    const isCorrect = option === selectedQuestion.correct_answer;
                                                    const isSelected = option === selectedQuestion.selected_answer;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`p-6 rounded-3xl border-2 transition-all flex items-start space-x-4 ${isCorrect
                                                                    ? 'bg-emerald-50 border-emerald-600 ring-8 ring-emerald-500/5'
                                                                    : isSelected && !isCorrect
                                                                        ? 'bg-red-50 border-red-600'
                                                                        : 'bg-white border-slate-100'
                                                                }`}
                                                        >
                                                            <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isCorrect ? 'bg-emerald-600 text-white' : isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'
                                                                }`}>
                                                                {label}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className={`text-base font-bold ${isCorrect ? 'text-emerald-900' : isSelected ? 'text-red-900' : 'text-slate-600'}`}>
                                                                    {option}
                                                                </p>
                                                                {isCorrect && (
                                                                    <span className="inline-block mt-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">Correct Solution</span>
                                                                )}
                                                                {isSelected && !isCorrect && (
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
                                        <Filter className="h-16 w-16 mb-4 opacity-10" />
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

export default DigitalSATResultsPage;
