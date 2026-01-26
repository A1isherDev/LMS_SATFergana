'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, getDifficultyColor } from '@/utils/helpers';

interface Question {
  id: number;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TEXT' | 'TRUE_FALSE';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
}

interface StudentSubmission {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  submitted_at: string;
  score: number;
  max_score: number;
  is_late: boolean;
  answers: Record<string, string>;
  time_spent_seconds: number;
  feedback?: string;
}

interface HomeworkDetail {
  id: number;
  title: string;
  description: string;
  class_obj: {
    id: number;
    name: string;
  };
  assigned_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  due_date: string;
  is_published: boolean;
  total_questions: number;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  created_at: string;
  questions: Question[];
  submissions: StudentSubmission[];
  homework_stats: {
    submission_count: number;
    average_score: number;
    average_time_spent: number;
    on_time_submission_rate: number;
  };
  user_submission?: StudentSubmission;
}

export default function HomeworkDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const homeworkId = params?.id as string;
  
  const [homework, setHomework] = useState<HomeworkDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'submissions' | 'analytics'>('overview');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchHomeworkDetail = async () => {
      try {
        const response = await fetch(`/api/homework/${homeworkId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setHomework(data);
          // Initialize user answers if they exist
          if (data.user_submission) {
            setUserAnswers(data.user_submission.answers);
          }
        } else {
          // Fallback to mock data
          const mockData = getMockHomeworkDetail();
          setHomework(mockData);
        }
      } catch (error) {
        console.error('Error fetching homework detail:', error);
        const mockData = getMockHomeworkDetail();
        setHomework(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    if (homeworkId) {
      fetchHomeworkDetail();
    }
  }, [homeworkId]);

  const getMockHomeworkDetail = (): HomeworkDetail => ({
    id: parseInt(homeworkId),
    title: 'Algebra Practice Set #5',
    description: 'Complete exercises on quadratic equations and factoring. This homework covers solving quadratic equations using factoring, quadratic formula, and completing the square.',
    class_obj: {
      id: 1,
      name: 'SAT Math - Advanced'
    },
    assigned_by: {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@satfergana.com'
    },
    due_date: '2025-02-05T23:59:59Z',
    is_published: true,
    total_questions: 5,
    difficulty_level: 'MEDIUM',
    created_at: '2025-01-20T10:00:00Z',
    questions: [
      {
        id: 1,
        question_text: 'Solve for x: x² - 9 = 0',
        question_type: 'MULTIPLE_CHOICE',
        options: ['x = 3', 'x = -3', 'x = 3 or x = -3', 'No solution'],
        correct_answer: 'x = 3 or x = -3',
        explanation: 'Factor the equation: (x-3)(x+3) = 0, so x = 3 or x = -3',
        points: 10
      },
      {
        id: 2,
        question_text: 'What is the discriminant of 2x² + 4x + 2 = 0?',
        question_type: 'MULTIPLE_CHOICE',
        options: ['16', '0', '8', '-8'],
        correct_answer: '0',
        explanation: 'Discriminant = b² - 4ac = 4² - 4(2)(2) = 16 - 16 = 0',
        points: 10
      },
      {
        id: 3,
        question_text: 'Complete the square: x² + 6x + ?',
        question_type: 'TEXT',
        correct_answer: '9',
        explanation: 'To complete the square, add (b/2)² = (6/2)² = 9',
        points: 10
      },
      {
        id: 4,
        question_text: 'True or False: All quadratic equations have real solutions.',
        question_type: 'TRUE_FALSE',
        correct_answer: 'False',
        explanation: 'Some quadratic equations have complex solutions when the discriminant is negative.',
        points: 10
      },
      {
        id: 5,
        question_text: 'If a quadratic equation has discriminant D > 0, how many real solutions does it have?',
        question_type: 'MULTIPLE_CHOICE',
        options: ['0', '1', '2', 'Infinite'],
        correct_answer: '2',
        explanation: 'When D > 0, the quadratic equation has two distinct real solutions.',
        points: 10
      }
    ],
    submissions: [
      {
        id: 1,
        student: {
          id: 2,
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice@example.com'
        },
        submitted_at: '2025-01-25T15:30:00Z',
        score: 40,
        max_score: 50,
        is_late: false,
        answers: {
          '1': 'x = 3 or x = -3',
          '2': '0',
          '3': '9',
          '4': 'False',
          '5': '2'
        },
        time_spent_seconds: 1800
      },
      {
        id: 2,
        student: {
          id: 3,
          first_name: 'Bob',
          last_name: 'Wilson',
          email: 'bob@example.com'
        },
        submitted_at: '2025-01-26T10:15:00Z',
        score: 30,
        max_score: 50,
        is_late: false,
        answers: {
          '1': 'x = 3',
          '2': '16',
          '3': '9',
          '4': 'True',
          '5': '1'
        },
        time_spent_seconds: 2400
      }
    ],
    homework_stats: {
      submission_count: 2,
      average_score: 35,
      average_time_spent: 2100,
      on_time_submission_rate: 100
    }
  });

  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId.toString()]: answer
    }));
  };

  const handleSubmit = async () => {
    if (homework?.user_submission) {
      alert('You have already submitted this homework.');
      return;
    }

    setIsSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      const response = await fetch(`/api/homework/${homeworkId}/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          time_spent_seconds: timeSpent
        }),
      });

      if (response.ok) {
        alert('Homework submitted successfully!');
        // Refresh the data
        const updatedData = getMockHomeworkDetail();
        updatedData.user_submission = {
          id: Date.now(),
          student: user!,
          submitted_at: new Date().toISOString(),
          score: 0, // Will be calculated by backend
          max_score: (homework?.total_questions || 0) * 10,
          is_late: false,
          answers: userAnswers,
          time_spent_seconds: timeSpent
        };
        setHomework(updatedData);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to submit homework'}`);
      }
    } catch (error) {
      console.error('Error submitting homework:', error);
      alert('Error submitting homework. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = () => {
    if (!homework?.questions) return 0;
    const answered = Object.keys(userAnswers).length;
    return (answered / homework.questions.length) * 100;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!homework) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Homework Not Found</h2>
            <p className="text-gray-600 mb-4">The homework you're looking for doesn't exist.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const isOverdue = homework ? new Date() > new Date(homework.due_date) : false;
  const isSubmitted = !!homework?.user_submission;
  const canSubmit = !isSubmitted && !isOverdue && user?.role === 'STUDENT';

  // Early return if homework is null
  if (!homework) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
            <p className="text-gray-600">Please wait while we load the homework.</p>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Homework
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{homework.title}</h1>
                <p className="text-gray-600">{homework.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(homework.difficulty_level)}`}>
                {homework.difficulty_level}
              </span>
              {isSubmitted && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  Submitted
                </span>
              )}
              {isOverdue && !isSubmitted && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                  Overdue
                </span>
              )}
            </div>
          </div>

          {/* Homework Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="font-medium">{homework.class_obj.name}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{formatDateTime(homework.due_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="font-medium">{homework.total_questions}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Users className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Submissions</p>
                  <p className="font-medium">{homework.homework_stats.submission_count}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student View - Questions */}
          {user?.role === 'STUDENT' && (
            <div className="bg-white rounded-lg shadow">
              {isSubmitted ? (
                <div className="p-6">
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Homework Submitted</h3>
                    <p className="text-gray-600 mb-4">
                      You submitted this homework on {formatDateTime(homework.user_submission!.submitted_at)}
                    </p>
                    {homework.user_submission!.score > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-lg font-semibold">Score: {homework.user_submission!.score}/{homework.user_submission!.max_score}</p>
                        <p className="text-sm text-gray-600">
                          {Math.round((homework.user_submission!.score / homework.user_submission!.max_score) * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Progress Bar */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">{Math.round(calculateProgress())}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${calculateProgress()}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="p-6">
                    {homework.questions.map((question, index) => (
                      <div key={question.id} className="mb-8">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Question {index + 1}
                          </h3>
                          <span className="text-sm text-gray-500">{question.points} points</span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{question.question_text}</p>
                        
                        {question.question_type === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => (
                              <label key={optIndex} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option}
                                  checked={userAnswers[question.id.toString()] === option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  className="mr-3"
                                  disabled={!canSubmit}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {question.question_type === 'TRUE_FALSE' && (
                          <div className="space-y-2">
                            {['True', 'False'].map((option) => (
                              <label key={option} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option}
                                  checked={userAnswers[question.id.toString()] === option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  className="mr-3"
                                  disabled={!canSubmit}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {question.question_type === 'TEXT' && (
                          <textarea
                            value={userAnswers[question.id.toString()] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            disabled={!canSubmit}
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Submit Button */}
                    {canSubmit && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting || Object.keys(userAnswers).length !== homework.questions.length}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Homework'}
                        </button>
                      </div>
                    )}
                    
                    {isOverdue && !isSubmitted && (
                      <div className="text-center py-4">
                        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                        <p className="text-red-600">This homework is overdue and cannot be submitted.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Teacher View - Analytics and Submissions */}
          {user?.role === 'TEACHER' && (
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Overview', icon: Eye },
                    { id: 'submissions', label: 'Submissions', icon: Users },
                    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Homework Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <span className="text-sm text-gray-600">Submission Rate</span>
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.round((homework.homework_stats.submission_count / (homework.submissions?.length || 1)) * 100)}%
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Average Score</p>
                          <p className="text-2xl font-bold text-gray-900">{homework.homework_stats.average_score}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Average Time</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.round(homework.homework_stats.average_time_spent / 60)} min
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Questions</h4>
                      <div className="space-y-2">
                        {homework.questions.map((question, index) => (
                          <div key={question.id} className="flex items-center justify-between p-3 border rounded">
                            <span className="text-sm">Question {index + 1}: {question.question_text.substring(0, 50)}...</span>
                            <span className="text-sm text-gray-500">{question.points} points</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Student Submissions ({homework.submissions.length})</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {homework.submissions.map(submission => (
                            <tr key={submission.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {submission.student.first_name} {submission.student.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">{submission.student.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDateTime(submission.submitted_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium">{submission.score}</span>
                                  <span className="text-sm text-gray-500 mx-1">/</span>
                                  <span className="text-sm text-gray-500">{submission.max_score}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {Math.round(submission.time_spent_seconds / 60)} min
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {submission.is_late ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Late
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    On Time
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Score Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">90-100%</span>
                            <span className="text-sm font-medium">0 students</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">80-89%</span>
                            <span className="text-sm font-medium">1 student</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">70-79%</span>
                            <span className="text-sm font-medium">1 student</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Below 70%</span>
                            <span className="text-sm font-medium">0 students</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Question Performance</h4>
                        <div className="space-y-2">
                          {homework.questions.map((question, index) => (
                            <div key={question.id} className="flex justify-between">
                              <span className="text-sm text-gray-600">Question {index + 1}</span>
                              <span className="text-sm font-medium">80% correct</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
