'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Clock, 
  Target, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  Timer,
  FileText,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, formatDuration, getSatScoreColor } from '@/utils/helpers';

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

interface ExamSession {
  id: number;
  mock_exam: MockExam;
  started_at: string;
  current_section: string;
  time_remaining: number;
  questions_answered: number;
  total_questions: number;
}

export default function MockExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<MockExam[]>([]);
  const [attempts, setAttempts] = useState<MockExamAttempt[]>([]);
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [isExamMode, setIsExamMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual exams and attempts from API
    const mockExams: MockExam[] = [
      {
        id: 1,
        title: 'Full SAT Practice Test #1',
        description: 'Complete 3-hour SAT practice test with all sections',
        exam_type: 'FULL',
        total_questions: 154,
        time_limit_minutes: 180,
        is_active: true,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        title: 'Math Section Practice',
        description: 'Focused math section with calculator and no-calculator parts',
        exam_type: 'MATH',
        total_questions: 58,
        time_limit_minutes: 80,
        is_active: true,
        created_at: '2024-01-18T14:30:00Z'
      },
      {
        id: 3,
        title: 'Reading & Writing Practice',
        description: 'Combined reading and writing sections practice',
        exam_type: 'READING',
        total_questions: 96,
        time_limit_minutes: 100,
        is_active: true,
        created_at: '2024-01-20T09:15:00Z'
      }
    ];

    const mockAttempts: MockExamAttempt[] = [
      {
        id: 1,
        mock_exam: mockExams[0],
        started_at: '2024-01-22T09:00:00Z',
        submitted_at: '2024-01-22T12:15:00Z',
        is_completed: true,
        sat_score: 1280,
        math_score: 640,
        reading_writing_score: 640,
        section_scores: {
          'Math - No Calculator': 320,
          'Math - Calculator': 320,
          'Reading': 320,
          'Writing': 320
        },
        created_at: '2024-01-22T09:00:00Z',
        updated_at: '2024-01-22T12:15:00Z'
      },
      {
        id: 2,
        mock_exam: mockExams[1],
        started_at: '2024-01-24T14:00:00Z',
        is_completed: false,
        sat_score: 0,
        math_score: 0,
        reading_writing_score: 0,
        section_scores: {},
        created_at: '2024-01-24T14:00:00Z',
        updated_at: '2024-01-24T14:00:00Z'
      }
    ];

    setTimeout(() => {
      setExams(mockExams);
      setAttempts(mockAttempts);
      setIsLoading(false);
    }, 1000);
  }, []);

  const startExam = (exam: MockExam) => {
    const session: ExamSession = {
      id: Date.now(),
      mock_exam: exam,
      started_at: new Date().toISOString(),
      current_section: 'Math - No Calculator',
      time_remaining: exam.time_limit_minutes * 60,
      questions_answered: 0,
      total_questions: exam.total_questions
    };
    setCurrentSession(session);
    setIsExamMode(true);
  };

  const pauseExam = () => {
    // TODO: Implement pause functionality
    console.log('Pausing exam');
  };

  const submitExam = () => {
    // TODO: Implement submit functionality
    setIsExamMode(false);
    setCurrentSession(null);
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

  if (isExamMode && currentSession) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-6xl mx-auto">
            {/* Exam Header */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{currentSession.mock_exam.title}</h1>
                <div className="flex space-x-3">
                  <button
                    onClick={pauseExam}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </button>
                  <button
                    onClick={submitExam}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Submit Exam
                  </button>
                </div>
              </div>
              
              {/* Exam Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Timer className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-2xl font-bold text-red-500">
                      {Math.floor(currentSession.time_remaining / 60)}:{(currentSession.time_remaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Time Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {currentSession.current_section}
                  </p>
                  <p className="text-sm text-gray-500">Current Section</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {currentSession.questions_answered}/{currentSession.total_questions}
                  </p>
                  <p className="text-sm text-gray-500">Questions Answered</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((currentSession.questions_answered / currentSession.total_questions) * 100)}%
                  </p>
                  <p className="text-sm text-gray-500">Progress</p>
                </div>
              </div>
            </div>

            {/* Exam Content */}
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center py-16">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam in Progress</h2>
                <p className="text-gray-600 mb-6">
                  This is a placeholder for the actual exam interface. In a real implementation, this would contain:
                </p>
                <ul className="text-left text-gray-600 max-w-md mx-auto space-y-2">
                  <li>• Current question with multiple choice options</li>
                  <li>• Navigation between questions</li>
                  <li>• Section switching functionality</li>
                  <li>• Real-time timer updates</li>
                  <li>• Answer saving and validation</li>
                </ul>
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
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            attempt.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
                            onClick={() => {
                              const session: ExamSession = {
                                id: attempt.id,
                                mock_exam: attempt.mock_exam,
                                started_at: attempt.started_at,
                                current_section: 'Math - No Calculator',
                                time_remaining: 60 * 60, // 1 hour remaining
                                questions_answered: 25,
                                total_questions: attempt.mock_exam.total_questions
                              };
                              setCurrentSession(session);
                              setIsExamMode(true);
                            }}
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
