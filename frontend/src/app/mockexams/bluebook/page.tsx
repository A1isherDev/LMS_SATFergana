'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Clock,
  Target,
  Play,
  CheckCircle,
  FileText,
  Timer,
  BookOpen,
  Calendar,
  Sparkles,
  Plus
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { bluebookApi } from '@/utils/api';

// Types
interface BluebookExam {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
  total_duration_minutes: number;
  has_active_attempt: boolean;
  active_attempt_id: number | null;
  completed_attempts: number;
}

interface BluebookAttempt {
  id: number;
  exam: BluebookExam;
  student: any;
  started_at?: string;
  submitted_at?: string;
}

// Main Component
const BluebookDigitalSATPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
<<<<<<< HEAD
=======
  const canCreate = user?.role === 'ADMIN' || user?.role === 'TEACHER';
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c

  const [exams, setExams] = useState<BluebookExam[]>([]);
  const [attempts, setAttempts] = useState<BluebookAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'attempts'>('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [examsResponse, attemptsResponse] = await Promise.all([
        bluebookApi.getExams(),
        bluebookApi.getAttempts()
      ]);
<<<<<<< HEAD

      const examsData = Array.isArray(examsResponse) ? examsResponse : (examsResponse as any)?.data || [];
      const attemptsData = Array.isArray(attemptsResponse) ? attemptsResponse : (attemptsResponse as any)?.data || [];

=======
      const examsData = Array.isArray(examsResponse) ? examsResponse : (examsResponse as any)?.results ?? (examsResponse as any)?.data ?? [];
      const attemptsData = Array.isArray(attemptsResponse) ? attemptsResponse : (attemptsResponse as any)?.results ?? (attemptsResponse as any)?.data ?? [];
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
      setExams(examsData);
      setAttempts(attemptsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load Digital SAT data');
    } finally {
      setIsLoading(false);
    }
  };

  const startExam = async (exam: BluebookExam) => {
    try {
      const response = await bluebookApi.startExam(exam.id) as { id: number };
      if (response?.id) {
        router.push(`/mockexams/bluebook/${response.id}`);
      } else {
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      toast.error('Failed to start exam');
    }
  };

  const resumeExam = (attemptId: number) => {
    router.push(`/mockexams/bluebook/${attemptId}`);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
            <div className="relative">
              <div className="h-24 w-24 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Timer className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Syncing Protocols</p>
              <p className="text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">Establishing Secure Connection...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
<<<<<<< HEAD
            <div className="mb-12">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Premium Simulator</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Bluebook Suite</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">
                Experience the exact fidelity of the modern Digital SAT. Adaptive modules, module-based progression, and strict time protocols.
              </p>
=======
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital SAT Practice</h1>
                <p className="text-gray-600">
                  Experience the official Digital SAT format with adaptive modules and built-in calculator
                </p>
              </div>
              {canCreate && (
                <Link
                  href="/admin/mock-exams/create"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Create DSAT Test
                </Link>
              )}
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-2 w-full justify-between items-center">
              <div className="flex space-x-2 p-1 bg-slate-100 dark:bg-gray-800 rounded-2xl w-fit">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`py-3 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'available'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Available Labs
                </button>
                <button
                  onClick={() => setActiveTab('attempts')}
                  className={`py-3 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'attempts'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Test History
                </button>
              </div>
              {user?.role !== 'STUDENT' && (
                <button
                  onClick={() => router.push('/mockexams/bluebook/create')}
                  className="py-3 px-6 bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-colors flex items-center shadow-md w-max ml-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Simulator
                </button>
              )}
            </div>

            {/* Content */}
            {activeTab === 'available' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <div key={exam.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-lg transition-all">
                    {/* Top Blue Section */}
                    <div className="bg-[#4656c3] p-6 text-white">
                      <div className="flex items-start mb-2">
                        <Calendar className="h-5 w-5 mr-3 mt-1 opacity-80" />
                        <h3 className="text-xl font-bold leading-tight">{exam.title}</h3>
                      </div>
                      <div className="flex items-center text-sm font-medium opacity-90 ml-8">
                        <Clock className="h-4 w-4 mr-1.5" />
                        <span>{formatDuration(exam.total_duration_minutes)}</span>
                        <span className="mx-2">•</span>
                        <BookOpen className="h-4 w-4 mr-1.5" />
                        <span>98 questions</span>
                      </div>
                    </div>

                    {/* Bottom White Section */}
                    <div className="p-6 bg-white dark:bg-gray-800 flex-1 flex flex-col space-y-4">
                      {/* Section representation similar to modules in image */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Reading & Writing</h4>
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 tracking-wide uppercase">
                            {exam.has_active_attempt ? 'In Progress' : 'Not Started'}
                          </span>
                        </div>
                        <button
                          onClick={() => startExam(exam)}
                          className="w-full py-3 bg-[#4656c3] text-white rounded font-bold tracking-wide hover:bg-[#3a48a3] transition-colors uppercase text-sm"
                        >
                          {exam.has_active_attempt ? 'RESUME PRACTICE' : 'START PRACTICE'}
                        </button>
                      </div>

<<<<<<< HEAD
                      <div className="pt-2"></div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Math</h4>
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 tracking-wide uppercase">
                            Locked
                          </span>
                        </div>
                        <button
                          disabled={true}
                          className="w-full py-3 bg-[#4656c3] text-white rounded font-bold tracking-wide hover:bg-[#3a48a3] transition-colors uppercase text-sm opacity-50 cursor-not-allowed"
                        >
                          START PRACTICE
                        </button>
                      </div>
=======
                    <div className="mt-6 flex space-x-3">
                      {exam.has_active_attempt && exam.active_attempt_id ? (
                        <button
                          onClick={() => resumeExam(exam.active_attempt_id!)}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume Exam
                        </button>
                      ) : (
                        <button
                          onClick={() => startExam(exam)}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Exam
                        </button>
                      )}
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-4">
                {attempts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm mb-6">
                      <FileText className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Archive Empty</h3>
                    <p className="text-slate-500 font-medium italic mb-8 max-w-sm text-center">
                      No Digital SAT simulation logs detected in your primary storage.
                    </p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
                    >
                      Start First Test
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {attempts.map((attempt) => (
                      <div key={attempt.id} className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center justify-between group hover:border-blue-400 transition-all">
                        <div className="flex items-center space-x-6">
                          <div className={`p-4 rounded-2xl ${attempt.submitted_at ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} transition-transform group-hover:scale-110`}>
                            {attempt.submitted_at ? <CheckCircle className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                              {attempt.exam.title}
                            </h3>
                            <div className="flex items-center space-x-6 mt-1">
                              <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar className="h-3 w-3 mr-2" />
                                {formatDate(attempt.started_at)}
                              </div>
                              {attempt.submitted_at && (
                                <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                  <CheckCircle className="h-3 w-3 mr-2" />
                                  SUBMITTED
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {attempt.submitted_at ? (
                            <button
                              onClick={() => resumeExam(attempt.id)}
                              className="px-8 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase italic tracking-widest text-[9px] hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                              Extraction Review
                            </button>
                          ) : (
                            <button
                              onClick={() => resumeExam(attempt.id)}
                              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] hover:bg-blue-500 hover:scale-105 transition-all shadow-lg shadow-blue-900/20"
                            >
                              Resume Link
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
};

export default BluebookDigitalSATPage;
