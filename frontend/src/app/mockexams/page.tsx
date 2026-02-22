'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Clock,
  Target,
  Play,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  Timer,
  FileText,
  Award,
  BookOpen,
  ArrowRight,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, formatDuration, getSatScoreColor } from '@/utils/helpers';
import { mockExamsApi } from '@/utils/api';
import { useRouter } from 'next/navigation';

interface MockExam {
  id: number;
  title: string;
  description: string;
  exam_type: 'FULL' | 'MATH' | 'READING' | 'WRITING';
  total_questions: number;
  time_limit_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface MockExamAttempt {
  id: number;
  mock_exam: MockExam;
  started_at: string;
  submitted_at?: string;
  is_completed: boolean;
  sat_score: number;
  math_score: number;
  reading_writing_score: number;
  section_scores: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export default function MockExamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<MockExam[]>([]);
  const [attempts, setAttempts] = useState<MockExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const examsResponse = await mockExamsApi.getExams();
        const examsData = Array.isArray(examsResponse) ? examsResponse : (examsResponse as any)?.data || [];
        setExams(examsData);

        const attemptsResponse = await mockExamsApi.getMyAttempts();
        const attemptsData = Array.isArray(attemptsResponse) ? attemptsResponse : (attemptsResponse as any)?.data || [];
        setAttempts(attemptsData);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const startExam = async (exam: MockExam) => {
    try {
      await mockExamsApi.startExam(exam.id);
      router.push(`/mockexams/${exam.id}`);
    } catch (error) {
      console.error('Failed to start exam:', error);
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'FULL': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/10';
      case 'MATH': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/10';
      case 'READING': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10';
      case 'WRITING': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/10';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-[2.5rem]"></div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const avgScore = attempts.filter(a => a.is_completed).length > 0
    ? Math.round(attempts.filter(a => a.is_completed).reduce((sum, a) => sum + a.sat_score, 0) / attempts.filter(a => a.is_completed).length)
    : 0;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-12 pb-20">
          {/* Header */}
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Testing Center</span>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Mock Exams</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2">Validate your readiness with adaptive simulations designed to mirror the actual Digital SAT experience.</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700 p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Available Labs</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black italic text-slate-900 dark:text-white">{exams.length}</span>
                <FileText className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700 p-6 border-b-emerald-500 border-b-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Completed</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black italic text-emerald-600">{attempts.filter(a => a.is_completed).length}</span>
                <CheckCircle className="h-8 w-8 text-emerald-500 opacity-20" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700 p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mastery Avg</p>
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-black italic ${getSatScoreColor(avgScore)}`}>{avgScore}</span>
                <Award className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700 p-6 border-b-orange-500 border-b-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">In Progress</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black italic text-orange-600">{attempts.filter(a => !a.is_completed).length}</span>
                <Clock className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Bluebook Digital SAT Section - Ultra Premium */}
          <div className="relative group overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-175 group-hover:rotate-6">
              <Zap className="h-64 w-64 text-blue-400" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="inline-flex items-center px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                  <Sparkles className="h-3 w-3 mr-2" />
                  Official Protocol
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Bluebook Simulator</h2>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Experience the full complexity of the modern Digital SAT. Our engine replicates adaptive algorithm logic,
                  module-based progression, and strict time protocols to ensure you are 100% prepared for test day.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Timer className="h-4 w-4 text-blue-400 mb-2" />
                    <p className="text-xs font-black italic uppercase">134 MIN</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Target className="h-4 w-4 text-emerald-400 mb-2" />
                    <p className="text-xs font-black italic uppercase">ADAPTIVE</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <BookOpen className="h-4 w-4 text-purple-400 mb-2" />
                    <p className="text-xs font-black italic uppercase">4 MODS</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Award className="h-4 w-4 text-orange-400 mb-2" />
                    <p className="text-xs font-black italic uppercase">1600 Pts</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => router.push('/mockexams/bluebook')}
                  className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center group"
                >
                  <Play className="h-5 w-5 mr-3 group-hover:fill-current" />
                  Start Simulation
                </button>
              </div>
            </div>
          </div>

          {/* Practice Labs Grid */}
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center italic">Available Practice Labs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex flex-col justify-between group hover:border-blue-400 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${getExamTypeColor(exam.exam_type)}`}>
                        {exam.exam_type}
                      </span>
                      <p className="text-[10px] font-black text-slate-400 uppercase italic">Test #{exam.id}</p>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-3 leading-tight">{exam.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 font-medium leading-relaxed">{exam.description}</p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <FileText className="h-4 w-4 mr-2 text-slate-300" />
                        {exam.total_questions} Questions Total
                      </div>
                      <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        <Clock className="h-4 w-4 mr-2 text-slate-300" />
                        {formatDuration(exam.time_limit_minutes)} Duration
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => startExam(exam)}
                    className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-600 hover:scale-[1.02] transition-all flex items-center justify-center group"
                  >
                    <Play className="h-4 w-4 mr-2 group-hover:fill-current" />
                    Start Test
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Performance History */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-10">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-10 tracking-tighter">Diagnostic History</h2>
            <div className="space-y-6">
              {attempts.length > 0 ? (
                attempts.slice().reverse().map((attempt) => (
                  <div key={attempt.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-slate-200 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight mr-4">
                          {attempt.mock_exam.title}
                        </h3>
                        <span className={`px-2 py-1 text-[8px] font-black rounded uppercase tracking-tighter ${attempt.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                          {attempt.is_completed ? 'Authenticated' : 'Active'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        SYNCHRONIZED ON {new Date(attempt.started_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-8">
                      {attempt.is_completed && (
                        <div className="flex gap-6 items-center">
                          <div className="text-center">
                            <p className={`text-2xl font-black italic tracking-tighter ${getSatScoreColor(attempt.sat_score)}`}>
                              {attempt.sat_score}
                            </p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Composite</p>
                          </div>
                          <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700" />
                          <div className="text-center">
                            <p className="text-lg font-black italic text-blue-500">{attempt.math_score}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Math</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black italic text-emerald-500">{attempt.reading_writing_score}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">R&W</p>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {attempt.is_completed ? (
                          <button
                            onClick={() => router.push(`/mockexams/results/${attempt.id}`)}
                            className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:scale-110 transition-all shadow-sm text-slate-400 hover:text-blue-600"
                          >
                            <BarChart3 className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/mockexams/${attempt.mock_exam.id}`)}
                            className="p-4 bg-blue-600 text-white rounded-2xl hover:scale-110 transition-all shadow-lg shadow-blue-200 shadow-blue-900/20"
                          >
                            <Play className="h-5 w-5 fill-current" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No diagnostics recorded in this cycle.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
