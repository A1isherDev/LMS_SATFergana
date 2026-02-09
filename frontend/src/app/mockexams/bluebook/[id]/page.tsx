'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    Menu,
    X,
    Calculator,
    AlertCircle,
    HelpCircle,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import { bluebookApi } from '@/utils/api';
import AuthGuard from '@/components/AuthGuard';

// Types
interface Question {
    id: number;
    question_text: string;
    question_type: string;
    options: string[];
    points: number;
}

interface ModuleData {
    id: number;
    title: string;
    order: number;
    section: string;
    questions: Question[];
    duration_minutes: number;
}

interface AttemptStatus {
    id: number;
    current_module: ModuleData | null;
    status: 'STARTED' | 'COMPLETED' | 'PAUSED' | 'BREAK';
    remaining_seconds: number;
    answers: Record<string, string>;
    flagged_questions: number[];
}

const DigitalSATTestPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const attemptId = parseInt(params.id as string);

    // State
    const [attempt, setAttempt] = useState<AttemptStatus | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuestionMenu, setShowQuestionMenu] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isBreakTime, setIsBreakTime] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Data
    const loadAttemptData = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await bluebookApi.getAttempt(attemptId) as any;

            // If the attempt is not started, start it
            if (data.status === 'CREATED') {
                await bluebookApi.startAttempt(attemptId);
                // Reload after starting
                const startedData = await bluebookApi.getAttempt(attemptId) as any;
                setupAttempt(startedData);
            } else {
                setupAttempt(data);
            }
        } catch (error) {
            console.error('Error loading attempt:', error);
            toast.error('Failed to load test data');
            router.push('/mockexams/bluebook');
        } finally {
            setIsLoading(false);
        }
    }, [attemptId, router]);

    const setupAttempt = (data: any) => {
        setAttempt(data);
        setAnswers(data.answers || {});
        setFlaggedQuestions(data.flagged_questions || []);

        // For adaptive test, we might need to fetch the current module if it's not in the attempt object
        if (!data.current_module && data.status === 'STARTED') {
            fetchCurrentModule();
        } else if (data.status === 'BREAK') {
            setIsBreakTime(true);
            setRemainingTime(600); // 10 minute break
        } else {
            setRemainingTime(data.remaining_seconds || 0);
        }
    };

    const fetchCurrentModule = async () => {
        try {
            const moduleData = await bluebookApi.getCurrentModule(attemptId) as ModuleData;
            setAttempt(prev => prev ? { ...prev, current_module: moduleData } : null);
            setRemainingTime(moduleData.duration_minutes * 60);
        } catch (error) {
            console.error('Error fetching module:', error);
        }
    };

    useEffect(() => {
        loadAttemptData();
    }, [loadAttemptData]);

    // Timer Logic
    useEffect(() => {
        if (remainingTime > 0 && attempt?.status === 'STARTED' && !isBreakTime) {
            timerRef.current = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        handleTimeExpiration();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (isBreakTime && remainingTime > 0) {
            timerRef.current = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        setIsBreakTime(false);
                        fetchCurrentModule();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [remainingTime, attempt?.status, isBreakTime]);

    const handleTimeExpiration = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        toast.error('Time expired!', { icon: '⏰' });
        handleSubmitModule();
    };

    // Actions
    const handleAnswerSelect = (questionId: number, answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId.toString()]: answer
        }));
    };

    const toggleFlag = async (questionId: number) => {
        const isFlagged = flaggedQuestions.includes(questionId);
        try {
            await bluebookApi.flagQuestion(attemptId, {
                question_id: questionId,
                flagged: !isFlagged
            });

            if (isFlagged) {
                setFlaggedQuestions(prev => prev.filter(id => id !== questionId));
            } else {
                setFlaggedQuestions(prev => [...prev, questionId]);
            }
        } catch (error) {
            console.error('Error flagging question:', error);
        }
    };

    const handleSubmitModule = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await bluebookApi.submitModule(attemptId, {
                answers,
                flagged_questions: flaggedQuestions
            }) as any;

            if (response.status === 'BREAK') {
                setIsBreakTime(true);
                setRemainingTime(600); // 10 minute break
                setAttempt(prev => prev ? { ...prev, status: 'BREAK', current_module: null } : null);
                toast.success('Module submitted! Take a 10-minute break.');
            } else if (response.status === 'COMPLETED') {
                router.push(`/mockexams/bluebook/results/${attemptId}`);
            } else if (response.status === 'STARTED') {
                // Next module started
                await fetchCurrentModule();
                setCurrentQuestionIndex(0);
                toast.success('Moving to next module');
            }
        } catch (error) {
            console.error('Error submitting module:', error);
            toast.error('Failed to submit module');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExitTest = () => {
        router.push('/mockexams/bluebook');
    };

    // UI Helpers
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Preparing your Digital SAT...</p>
                </div>
            </div>
        );
    }

    if (isBreakTime) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                        <Clock className="h-10 w-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Break Time</h1>
                        <p className="text-slate-500 mt-2 font-medium">Rest your eyes and stretch. Your next module will begin soon.</p>
                    </div>
                    <div className="bg-slate-50 py-4 px-6 rounded-2xl border border-slate-100">
                        <p className="text-4xl font-mono font-black text-blue-600">
                            {formatTime(remainingTime)}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsBreakTime(false);
                            fetchCurrentModule();
                        }}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center group"
                    >
                        Resume Now
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    const currentModule = attempt?.current_module;
    const questions = currentModule?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 font-medium">No questions found in this module.</p>
                    <button onClick={() => router.push('/mockexams/bluebook')} className="mt-4 text-blue-600 hover:underline">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden">
                {/* Bluebook Top Nav */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white sticky top-0 z-50">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                            <span className="font-black text-xl italic tracking-tighter text-slate-900">BLUEBOOK</span>
                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-[10px] font-bold text-white rounded uppercase tracking-widest">Digital SAT</span>
                        </div>
                        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Section {currentModule?.order}</p>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{currentModule?.section}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border-2 transition-all ${remainingTime < 300 ? 'border-red-100 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 bg-slate-50 text-slate-900'}`}>
                            <Clock className="h-4 w-4" />
                            <span className="font-mono font-black text-lg tabular-nums">{formatTime(remainingTime)}</span>
                        </div>
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Exit Test"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col items-center bg-slate-50/50 overflow-y-auto pt-8 pb-24 px-6 custom-scrollbar">
                        <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
                            {/* Inner Header */}
                            <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <span className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                                        {currentQuestionIndex + 1}
                                    </span>
                                    <div className="h-4 w-px bg-slate-100" />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {questions.length}</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleFlag(currentQuestion.id)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${flaggedQuestions.includes(currentQuestion.id)
                                                ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                                : 'bg-slate-50 text-slate-400 border border-transparent hover:border-slate-200'
                                            }`}
                                    >
                                        <Flag className={`h-4 w-4 ${flaggedQuestions.includes(currentQuestion.id) ? 'fill-current' : ''}`} />
                                        <span>{flaggedQuestions.includes(currentQuestion.id) ? 'Flagged' : 'Flag'}</span>
                                    </button>
                                    <button className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                                        <Calculator className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="flex-1 p-10 lg:p-14 overflow-hidden">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
                                    {/* Stimulus/Text */}
                                    <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar max-h-[500px]">
                                        <div className="prose prose-slate prose-lg max-w-none">
                                            <div
                                                dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
                                                className="text-slate-900 leading-relaxed font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-4">
                                        {currentQuestion.options?.map((option, idx) => {
                                            const label = String.fromCharCode(65 + idx);
                                            const isSelected = answers[currentQuestion.id.toString()] === option;

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                                                    className={`w-full group text-left p-5 rounded-2xl border-2 transition-all flex items-start space-x-4 ${isSelected
                                                            ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-600/10'
                                                            : 'bg-white border-slate-100 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                                        }`}>
                                                        {label}
                                                    </span>
                                                    <span className={`text-base font-bold transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-600'
                                                        }`}>
                                                        {option}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Bottom Nav Controls */}
                    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-between px-10 z-50">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowQuestionMenu(true)}
                                className="flex items-center space-x-3 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                            >
                                <Menu className="h-5 w-5" />
                                <span>Question Menu</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center space-x-2 px-6 py-2.5 border-2 border-slate-100 text-slate-400 rounded-xl font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>Previous</span>
                            </button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmitModule}
                                    disabled={isSubmitting}
                                    className="flex items-center space-x-3 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200 uppercase tracking-widest text-xs transition-all"
                                >
                                    <span>Review & Submit</span>
                                    <CheckCircle className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 shadow-xl shadow-slate-200 uppercase tracking-widest text-xs transition-all"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Question Menu Drawer */}
                {showQuestionMenu && (
                    <div className="fixed inset-0 z-[100] flex">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowQuestionMenu(false)} />
                        <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Question Menu</h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Review your progress</p>
                                </div>
                                <button onClick={() => setShowQuestionMenu(false)} className="p-2 hover:bg-slate-50 rounded-lg">
                                    <X className="h-6 w-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 gap-4 auto-rows-max">
                                {questions.map((q, idx) => {
                                    const isAnswered = !!answers[q.id.toString()];
                                    const isFlagged = flaggedQuestions.includes(q.id);
                                    const isCurrent = idx === currentQuestionIndex;

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                setCurrentQuestionIndex(idx);
                                                setShowQuestionMenu(false);
                                            }}
                                            className={`relative aspect-square rounded-2xl border-2 flex items-center justify-center font-black transition-all ${isCurrent
                                                    ? 'border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-600/10'
                                                    : isAnswered
                                                        ? 'border-slate-900 bg-slate-900 text-white'
                                                        : 'border-slate-100 bg-white text-slate-400'
                                                }`}
                                        >
                                            {idx + 1}
                                            {isFlagged && (
                                                <div className="absolute -top-1 -right-1">
                                                    <div className="w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                                                        <Flag className="h-2.5 w-2.5 text-white fill-current" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Answered</p>
                                        <p className="text-2xl font-black text-slate-900">{Object.keys(answers).length} / {questions.length}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flagged</p>
                                        <p className="text-2xl font-black text-amber-500">{flaggedQuestions.length}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubmitModule}
                                    disabled={isSubmitting}
                                    className="w-full mt-6 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-sm"
                                >
                                    Finish Module
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Exit Confirmation Dialog */}
                {showExitConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-10 text-center animate-in zoom-in-95 duration-200">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">Pause Test?</h2>
                            <p className="text-slate-500 mt-3 font-medium">Your progress will be saved, and you can resume from this point later.</p>

                            <div className="mt-8 space-y-3">
                                <button
                                    onClick={handleExitTest}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                                >
                                    Save and Exit
                                </button>
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="w-full py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                                >
                                    Keep Testing
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
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
            </div>
        </AuthGuard>
    );
};

export default DigitalSATTestPage;
