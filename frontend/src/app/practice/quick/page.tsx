'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Brain, Target, Sparkles, Trophy } from 'lucide-react';
import { questionsApi, analyticsApi } from '@/utils/api';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
import QuestionCard from '@/components/QuestionCard';

export default function QuickPracticePage() {
    const router = useRouter();
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<'loading' | 'preparing' | 'playing' | 'finished'>('loading');
    const [score, setScore] = useState(0);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');

    useEffect(() => {
        startSession();
    }, []);

    const startSession = async () => {
        setStatus('loading');
        try {
            // 1. Start study session
            const session: any = await analyticsApi.startStudySession('QUESTION_PRACTICE');
            setSessionId(session.id);

            // 2. Fetch random questions
            const data: any = await questionsApi.getPracticeQuestions({ count: 10 });
            setQuestions(data);

            setStatus('playing');
        } catch (error) {
            console.error('Error starting practice session:', error);
            alert('Failed to start session. Please try again.');
            router.back();
        }
    };

    const handleAnswer = async (answer: string) => {
        const question = questions[currentIndex];
        setUserAnswer(answer);

        try {
            const response: any = await questionsApi.submitAttempt(question.id, {
                selected_option: answer,
                context: 'PRACTICE'
            });

            setIsCorrect(response.is_correct);
            if (response.is_correct) {
                setScore(s => s + 1);
            }
            setShowResult(true);

            // Update active session stats
            if (sessionId) {
                await analyticsApi.updateActiveSession(sessionId, {
                    questions_attempted: 1, // backend should increment these
                    questions_correct: response.is_correct ? 1 : 0
                });
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    };

    const nextQuestion = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(currentIndex + 1);
            setShowResult(false);
            setUserAnswer('');
        } else {
            finishSession();
        }
    };

    const finishSession = async () => {
        setStatus('finished');
        if (sessionId) {
            try {
                await analyticsApi.endStudySession(sessionId);
            } catch (error) {
                console.error('Error ending session:', error);
            }
        }
    };

    const mapToQuestionCard = (q: any) => {
        if (!q) return null;
        return {
            id: q.id,
            questionText: q.question_text,
            questionType: q.question_type,
            options: q.options?.map((opt: any) => ({
                id: opt.id,
                text: opt.option_text,
                isCorrect: opt.is_correct
            })),
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            subject: q.skill_tag,
            difficulty: q.difficulty,
            points: q.points || 10
        };
    };

    if (status === 'loading') {
        return (
            <AuthGuard>
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        <p className="text-gray-600 font-medium">Generating your practice session...</p>
                    </div>
                </DashboardLayout>
            </AuthGuard>
        );
    }

    if (status === 'finished') {
        return (
            <AuthGuard>
                <DashboardLayout>
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <Trophy className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Practice Complete!</h1>
                            <p className="text-gray-500 mt-2">Great job on finishing your quick practice session.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Score</p>
                                <p className="text-2xl font-bold text-gray-900">{score} / {questions.length}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Accuracy</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {Math.round((score / questions.length) * 100)}%
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg"
                            >
                                Back to Dashboard
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </DashboardLayout>
            </AuthGuard>
        );
    }

    const currentQuestion = questions[currentIndex];
    const mappedQuestion = mapToQuestionCard(currentQuestion);

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="flex items-center space-x-2">
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                <span className="font-bold text-gray-900">Quick Practice</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Progress</span>
                                <span className="text-sm font-bold text-gray-700">{currentIndex + 1} / {questions.length}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Current Score</span>
                                <span className="text-sm font-bold text-green-600">{score} items</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>

                    {mappedQuestion && (
                        <QuestionCard
                            question={mappedQuestion}
                            onAnswer={handleAnswer}
                            showResult={showResult}
                            userAnswer={userAnswer}
                            isCorrect={isCorrect}
                            interactive={!showResult}
                        />
                    )}

                    {showResult && (
                        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <button
                                onClick={nextQuestion}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                            >
                                <span>{currentIndex + 1 === questions.length ? 'Finish Session' : 'Next Question'}</span>
                                <CheckCircle className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
