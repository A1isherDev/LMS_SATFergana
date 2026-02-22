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
  Calendar
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
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
  const canCreate = user?.role === 'ADMIN' || user?.role === 'TEACHER';

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
      const examsData = Array.isArray(examsResponse) ? examsResponse : (examsResponse as any)?.results ?? (examsResponse as any)?.data ?? [];
      const attemptsData = Array.isArray(attemptsResponse) ? attemptsResponse : (attemptsResponse as any)?.results ?? (attemptsResponse as any)?.data ?? [];
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
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading Digital SAT...</p>
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
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
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
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('available')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'available'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Available Exams
                  </button>
                  <button
                    onClick={() => setActiveTab('attempts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'attempts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    My Attempts
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'available' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <div key={exam.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {exam.is_active && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                        {exam.has_active_attempt && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatDuration(exam.total_duration_minutes)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="h-4 w-4 mr-2" />
                        <span>{exam.completed_attempts} completed</span>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">Official Digital SAT Structure:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-blue-800">Reading & Writing (64 min):</p>
                          <p className="text-gray-600">• Module 1: 32 min (27 questions)</p>
                          <p className="text-gray-600">• Module 2: 32 min (27 questions)</p>
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Math (70 min):</p>
                          <p className="text-gray-600">• Module 1: 35 min (22 questions)</p>
                          <p className="text-gray-600">• Module 2: 35 min (22 questions)</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
                        <p className="font-medium text-blue-900">Key Features:</p>
                        <p className="text-sm text-gray-700">• 4 modules total (2 per section)</p>
                        <p className="text-sm text-gray-700">• 32 minutes per module</p>
                        <p className="text-sm text-gray-700">• Module 2 adapts based on Module 1 performance</p>
                        <p className="text-sm text-gray-700">• Calculator available in Math modules</p>
                        <p className="text-sm text-gray-700">• No cross-module navigation</p>
                      </div>
                    </div>

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
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-4">
                {attempts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start your first Digital SAT practice exam to see your results here.
                    </p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start First Exam
                    </button>
                  </div>
                ) : (
                  attempts.map((attempt) => (
                    <div key={attempt.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {attempt.exam.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Started: {formatDate(attempt.started_at)}
                            </div>
                            {attempt.submitted_at && (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completed: {formatDate(attempt.submitted_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {attempt.submitted_at ? (
                            <button
                              onClick={() => resumeExam(attempt.id)}
                              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Review Results
                            </button>
                          ) : (
                            <button
                              onClick={() => resumeExam(attempt.id)}
                              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Resume Exam
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
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
