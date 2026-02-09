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
  BookOpen
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

        // Fetch available exams
        const examsResponse = await mockExamsApi.getExams();
        const examsData = Array.isArray(examsResponse) ? examsResponse : (examsResponse as any)?.data || [];
        setExams(examsData);

        // Fetch user's attempts
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
      const response = await mockExamsApi.startExam(exam.id);
      // Navigate to the Bluebook-style exam interface
      router.push(`/mockexams/${exam.id}`);
    } catch (error) {
      console.error('Failed to start exam:', error);
    }
  };



  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'FULL':
        return 'bg-purple-100 text-purple-800';
      case 'MATH':
        return 'bg-blue-100 text-blue-800';
      case 'READING':
        return 'bg-green-100 text-green-800';
      case 'WRITING':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 1400) return 'text-green-600';
    if (score >= 1200) return 'text-blue-600';
    if (score >= 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }



  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mock Exams</h1>
              <p className="text-gray-600">Practice with full-length SAT tests and section-specific exams</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Exams</p>
                  <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attempts.filter(a => a.is_completed).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(
                    attempts.filter(a => a.is_completed).length > 0
                      ? Math.round(attempts.filter(a => a.is_completed).reduce((sum, a) => sum + a.sat_score, 0) / attempts.filter(a => a.is_completed).length)
                      : 0
                  )}`}>
                    {attempts.filter(a => a.is_completed).length > 0
                      ? Math.round(attempts.filter(a => a.is_completed).reduce((sum, a) => sum + a.sat_score, 0) / attempts.filter(a => a.is_completed).length)
                      : 0}
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attempts.filter(a => !a.is_completed).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Bluebook Digital SAT Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bluebook Digital SAT</h2>
                  <p className="text-gray-600">Official Digital SAT practice with adaptive difficulty</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/mockexams/bluebook')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Digital SAT
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <Timer className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">2h 14min</p>
                  <p className="text-sm text-gray-600">Total duration</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 text-white p-2 rounded-lg">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Adaptive</p>
                  <p className="text-sm text-gray-600">2 modules per section</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 text-white p-2 rounded-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">4 Modules</p>
                  <p className="text-sm text-gray-600">R&W + Math</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-600 text-white p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">400-1600</p>
                  <p className="text-sm text-gray-600">SAT scoring</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Digital SAT Structure:</h3>
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
                <p className="font-medium text-blue-900">Official Digital SAT Format:</p>
                <p className="text-sm text-gray-700">• 4 modules total (2 per section)</p>
                <p className="text-sm text-gray-700">• 32 minutes per module</p>
                <p className="text-sm text-gray-700">• Module 2 adapts based on Module 1 performance</p>
                <p className="text-sm text-gray-700">• No cross-module navigation allowed</p>
              </div>
            </div>
          </div>

          {/* Available Exams */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Exam Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExamTypeColor(exam.exam_type)}`}>
                        {exam.exam_type}
                      </span>
                    </div>

                    {/* Exam Description */}
                    <p className="text-gray-600 mb-4">{exam.description}</p>

                    {/* Exam Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-2" />
                        {exam.total_questions} questions
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatDuration(exam.time_limit_minutes)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        Created {formatDate(exam.created_at)}
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => startExam(exam)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Exam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Attempts */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Attempts</h2>
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {attempt.mock_exam.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${attempt.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {attempt.is_completed ? 'Completed' : 'In Progress'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Started {formatDateTime(attempt.started_at)}
                          </div>
                          {attempt.submitted_at && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Submitted {formatDateTime(attempt.submitted_at)}
                            </div>
                          )}
                        </div>

                        {attempt.is_completed && (
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className={`text-lg font-bold ${getSatScoreColor(attempt.sat_score)}`}>
                                {attempt.sat_score}
                              </p>
                              <p className="text-xs text-gray-500">Total Score</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">{attempt.math_score}</p>
                              <p className="text-xs text-gray-500">Math</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">{attempt.reading_writing_score}</p>
                              <p className="text-xs text-gray-500">Reading & Writing</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        {attempt.is_completed ? (
                          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <BarChart3 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push(`/mockexams/${attempt.mock_exam.id}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
