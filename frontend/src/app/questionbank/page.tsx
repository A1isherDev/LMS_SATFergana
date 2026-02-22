'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Brain,
  Filter,
  Search,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Zap,
  Target,
  Sparkles,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectColor, getDifficultyColor } from '@/utils/helpers';
import { questionBankApi } from '@/utils/api';

import { QuestionBankDashboard } from './components/QuestionBankDashboard';

interface Question {
  id: number;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TEXT' | 'MATH';
  subject: 'MATH' | 'READING' | 'WRITING';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correct_answer: string;
  explanation: string;
  options?: string[];
  tags: string[];
  attempt_count: number;
  accuracy_rate: number;
}

interface PracticeSession {
  id: number;
  started_at: string;
  questions_answered: number;
  correct_answers: number;
  time_spent: number;
}

function QuestionBankContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject');
  const skillTagParam = searchParams.get('skill_tag');
  const viewParam = searchParams.get('view');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [sessionStats, setSessionStats] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(skillTagParam || '');
  const [filterSubject, setFilterSubject] = useState<string>(
    subjectParam ? subjectParam.toUpperCase() : 'all'
  );
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Default to Dashboard view unless 'list' is specified or we have search params
  const [currentView, setCurrentView] = useState<'dashboard' | 'list'>(
    viewParam === 'list' || subjectParam || skillTagParam ? 'list' : 'dashboard'
  );

  // Effect to handle initial load or view changes
  useEffect(() => {
    if (currentView === 'list') {
      const fetchQuestions = async () => {
        try {
          setIsLoading(true);
          const response = await questionBankApi.getQuestions({
            subject: filterSubject !== 'all' ? filterSubject : undefined,
            difficulty: filterDifficulty !== 'all' ? filterDifficulty : undefined,
            question_type: filterType !== 'all' ? filterType : undefined,
            search: searchTerm || undefined
          });
          setQuestions((response as any).results || response);
        } catch (error) {
          setQuestions([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [filterSubject, filterDifficulty, filterType, searchTerm, currentView]);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = (q.question_text?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (q.tags || []).some(tag => (tag?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesType = filterType === 'all' || q.question_type === filterType;

    return matchesSearch && matchesSubject && matchesDifficulty && matchesType;
  });

  const handleTopicSelect = (subject: string, category: string, skill: string) => {
    setFilterSubject(subject);
    setSearchTerm(skill); // Using skill tag as search term to filter
    setCurrentView('list');
    // Update URL without full reload
    const params = new URLSearchParams();
    params.set('view', 'list');
    params.set('subject', subject);
    params.set('skill_tag', skill);
    router.push(`/questionbank?${params.toString()}`);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setFilterSubject('all');
    setSearchTerm('');
    router.push('/questionbank');
  };

  const startPractice = () => {
    const availableQuestions = filteredQuestions.length > 0 ? filteredQuestions : questions;
    if (availableQuestions.length > 0) {
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      setCurrentQuestion(randomQuestion);
      setIsPracticeMode(true);
      setSelectedAnswer('');
      setShowExplanation(false);
      setSessionStats({
        id: Date.now(),
        started_at: new Date().toISOString(),
        questions_answered: 0,
        correct_answers: 0,
        time_spent: 0
      });
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer) return;
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setShowExplanation(true);
    try {
      await questionBankApi.submitAttempt({
        question: currentQuestion.id,
        selected_answer: selectedAnswer,
        time_spent_seconds: sessionStats ? Math.floor((Date.now() - new Date(sessionStats.started_at).getTime()) / 1000) : 0,
        context: 'PRACTICE'
      });
    } catch (error) { }
    setSessionStats(prev => prev ? {
      ...prev,
      questions_answered: prev.questions_answered + 1,
      correct_answers: prev.correct_answers + (isCorrect ? 1 : 0)
    } : null);
  };

  const nextQuestion = () => {
    const availableQuestions = filteredQuestions.length > 0 ? filteredQuestions : questions;
    const remainingQuestions = availableQuestions.filter(q => q.id !== currentQuestion?.id);
    if (remainingQuestions.length > 0) {
      const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
      setCurrentQuestion(randomQuestion);
      setSelectedAnswer('');
      setShowExplanation(false);
    } else {
      setIsPracticeMode(false);
      setCurrentQuestion(null);
    }
  };

  const endPractice = () => {
    setIsPracticeMode(false);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setShowExplanation(false);
  };

  if (isPracticeMode && currentQuestion) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Practice Header */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Brain className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex items-center justify-between mb-8">
                <div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Active Session</span>
                  <h1 className="text-2xl font-black italic uppercase italic tracking-tighter">Live Practice</h1>
                </div>
                <button
                  onClick={endPractice}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Terminate
                </button>
              </div>

              {sessionStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-2xl font-black italic text-blue-400">{sessionStats.questions_answered}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Answered</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-2xl font-black italic text-emerald-400">
                      {sessionStats.questions_answered > 0
                        ? Math.round((sessionStats.correct_answers / sessionStats.questions_answered) * 100)
                        : 0}%
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Precision</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-2xl font-black italic text-purple-400">{sessionStats.correct_answers}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Acquired</p>
                  </div>
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${getSubjectColor(currentQuestion.subject)}`}>
                    {currentQuestion.subject}
                  </span>
                  <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <Sparkles className="h-4 w-4 text-slate-300" />
                  Accuracy: {currentQuestion.accuracy_rate}%
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
                  {currentQuestion.question_text}
                </h2>

                {/* Answer Options */}
                {currentQuestion.question_type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
                  <div className="grid grid-cols-1 gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => !showExplanation && setSelectedAnswer(option)}
                        disabled={showExplanation}
                        className={`group flex items-center p-6 border-2 rounded-[1.5rem] transition-all text-left ${selectedAnswer === option
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                          : 'border-slate-100 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                          } ${showExplanation && option === currentQuestion.correct_answer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : ''}
                          ${showExplanation && selectedAnswer === option && option !== currentQuestion.correct_answer ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
                        `}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-4 text-[10px] font-black transition-all ${selectedAnswer === option ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          } ${showExplanation && option === currentQuestion.correct_answer ? 'bg-emerald-600 text-white' : ''}
                          ${showExplanation && selectedAnswer === option && option !== currentQuestion.correct_answer ? 'bg-red-600 text-white' : ''}
                        `}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1 font-bold text-slate-700 dark:text-slate-200">{option}</span>
                        {showExplanation && option === currentQuestion.correct_answer && (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        )}
                        {showExplanation && selectedAnswer === option && option !== currentQuestion.correct_answer && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'TEXT' && (
                  <textarea
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={showExplanation}
                    placeholder="Input detailed response..."
                    className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-gray-700 rounded-[1.5rem] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-300"
                    rows={4}
                  />
                )}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-[1.5rem] p-8 mb-10">
                  <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Zap className="h-4 w-4" />
                    Protocol Breakdown
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-6 border-t border-slate-100 dark:border-gray-700 pt-10">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  REF ID: {currentQuestion.id} • {currentQuestion.attempt_count} ATTEMPT CYCLES
                </div>
                <div className="flex gap-4">
                  {!showExplanation ? (
                    <button
                      onClick={submitAnswer}
                      disabled={!selectedAnswer}
                      className="px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-600 disabled:opacity-20 transition-all"
                    >
                      Authenticate Answer
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/20 flex items-center"
                    >
                      Next Objective
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-12 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {currentView === 'list' && (
                  <button
                    onClick={handleBackToDashboard}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    <ArrowRight className="h-3 w-3 rotate-180" /> Back to Dashboard
                  </button>
                )}
                {currentView === 'dashboard' && (
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block">Central Depository</span>
                )}
              </div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Question Bank</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2">
                {currentView === 'dashboard'
                  ? 'Filter through our massive repository of high-fidelity SAT simulations.'
                  : `Browsing ${filteredQuestions.length} questions`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {['TEACHER', 'ADMIN'].includes(user?.role || '') && (
                <button
                  onClick={() => router.push('/questionbank/create')}
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border border-slate-200 dark:border-gray-700 rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-3"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </button>
              )}
              {currentView === 'list' && (
                <button
                  onClick={startPractice}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-3"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Start Practice
                </button>
              )}
            </div>
          </div>

          {currentView === 'dashboard' ? (
            <QuestionBankDashboard onSelectTopic={handleTopicSelect} />
          ) : (
            <>
              {/* Search/Filter Bar */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative w-full">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by topic, tag, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    <option value="all text-slate-400">All Subjects</option>
                    <option value="MATH">Math Section</option>
                    <option value="READING">Reading Ops</option>
                    <option value="WRITING">Writing Protocol</option>
                  </select>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    <option value="all">Any Gravity</option>
                    <option value="EASY">Low Strain</option>
                    <option value="MEDIUM">Medium Mass</option>
                    <option value="HARD">High Velocity</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1rem] text-[10px] font-black uppercase tracking-widest text-slate-500"
                  >
                    <option value="all">All Models</option>
                    <option value="MULTIPLE_CHOICE">Discrete</option>
                    <option value="TEXT">Synthesized</option>
                    <option value="MATH">Analytical</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Questions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {filteredQuestions.map((question) => (
                      <div key={question.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex flex-col justify-between group hover:border-blue-400 transition-all relative">
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-[8px] font-black rounded-md uppercase tracking-wider ${getSubjectColor(question.subject)}`}>
                                {question.subject}
                              </span>
                              <span className={`px-2 py-1 text-[8px] font-black rounded-md uppercase tracking-wider ${getDifficultyColor(question.difficulty)}`}>
                                {question.difficulty}
                              </span>
                            </div>
                            <div className="text-[10px] font-black text-slate-300 uppercase italic">#{question.id}</div>
                          </div>

                          <h3 className="text-md font-bold text-slate-700 dark:text-slate-200 line-clamp-3 mb-6 leading-relaxed group-hover:text-blue-600 transition-colors">
                            {question.question_text}
                          </h3>

                          <div className="flex flex-wrap gap-2 mb-8">
                            {question.tags?.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 text-[9px] font-black bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-lg uppercase tracking-tighter"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-auto space-y-6">
                          <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-900 pt-6">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-slate-300" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{question.accuracy_rate}% Precision</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{question.attempt_count} Cycles</span>
                          </div>

                          <button
                            onClick={() => {
                              setCurrentQuestion(question);
                              setIsPracticeMode(true);
                              setSelectedAnswer('');
                              setShowExplanation(false);
                            }}
                            className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-600 hover:scale-[1.02] transition-all flex items-center justify-center group/btn"
                          >
                            Start Practice
                            <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Empty State */}
                  {filteredQuestions.length === 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Brain className="h-8 w-8 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">No Records Found</h3>
                      <p className="text-slate-400 font-medium italic">Adjust your query parameters.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function QuestionBankPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    }>
      <QuestionBankContent />
    </Suspense>
  );
}
