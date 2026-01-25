'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar, 
  Clock, 
  Target, 
  Brain, 
  BookOpen, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, formatPercentage, getSatScoreColor, getSubjectColor } from '@/utils/helpers';

interface ProgressData {
  date: string;
  homework_completion: number;
  sat_score: number;
  study_time: number;
  flashcard_mastery: number;
}

interface WeakArea {
  subject: string;
  subcategory: string;
  accuracy_rate: number;
  total_attempts: number;
  improvement_suggestion: string;
}

interface StudySession {
  id: number;
  session_type: string;
  started_at: string;
  duration_minutes: number;
  questions_attempted: number;
  questions_correct: number;
  flashcards_reviewed: number;
}

interface PerformanceTrend {
  period: string;
  score: number;
  accuracy: number;
  study_time: number;
}

interface StudentSummary {
  total_study_time: number;
  average_sat_score: number;
  homework_completion_rate: number;
  flashcard_mastery_rate: number;
  current_streak: number;
  longest_streak: number;
  weak_areas_count: number;
  strong_areas_count: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual analytics data from API
    const mockProgressData: ProgressData[] = [
      { date: '2024-01-20', homework_completion: 85, sat_score: 1180, study_time: 120, flashcard_mastery: 45 },
      { date: '2024-01-21', homework_completion: 90, sat_score: 1200, study_time: 90, flashcard_mastery: 48 },
      { date: '2024-01-22', homework_completion: 88, sat_score: 1220, study_time: 150, flashcard_mastery: 52 },
      { date: '2024-01-23', homework_completion: 92, sat_score: 1250, study_time: 110, flashcard_mastery: 55 },
      { date: '2024-01-24', homework_completion: 95, sat_score: 1280, study_time: 135, flashcard_mastery: 58 },
      { date: '2024-01-25', homework_completion: 93, sat_score: 1300, study_time: 125, flashcard_mastery: 62 },
    ];

    const mockWeakAreas: WeakArea[] = [
      {
        subject: 'MATH',
        subcategory: 'Algebra',
        accuracy_rate: 65,
        total_attempts: 45,
        improvement_suggestion: 'Focus on quadratic equations and factoring techniques'
      },
      {
        subject: 'READING',
        subcategory: 'Inference Questions',
        accuracy_rate: 58,
        total_attempts: 32,
        improvement_suggestion: 'Practice identifying textual evidence and supporting details'
      },
      {
        subject: 'WRITING',
        subcategory: 'Grammar Rules',
        accuracy_rate: 72,
        total_attempts: 28,
        improvement_suggestion: 'Review subject-verb agreement and punctuation rules'
      }
    ];

    const mockStudySessions: StudySession[] = [
      {
        id: 1,
        session_type: 'MOCK_EXAM',
        started_at: '2024-01-25T09:00:00Z',
        duration_minutes: 180,
        questions_attempted: 154,
        questions_correct: 120,
        flashcards_reviewed: 0
      },
      {
        id: 2,
        session_type: 'HOMEWORK',
        started_at: '2024-01-24T19:00:00Z',
        duration_minutes: 45,
        questions_attempted: 25,
        questions_correct: 22,
        flashcards_reviewed: 0
      },
      {
        id: 3,
        session_type: 'FLASHCARDS',
        started_at: '2024-01-24T20:30:00Z',
        duration_minutes: 30,
        questions_attempted: 0,
        questions_correct: 0,
        flashcards_reviewed: 50
      }
    ];

    const mockPerformanceTrends: PerformanceTrend[] = [
      { period: 'Week 1', score: 1100, accuracy: 65, study_time: 420 },
      { period: 'Week 2', score: 1150, accuracy: 68, study_time: 480 },
      { period: 'Week 3', score: 1200, accuracy: 72, study_time: 520 },
      { period: 'Week 4', score: 1280, accuracy: 78, study_time: 580 },
    ];

    const mockStudentSummary: StudentSummary = {
      total_study_time: 2850,
      average_sat_score: 1280,
      homework_completion_rate: 91,
      flashcard_mastery_rate: 62,
      current_streak: 12,
      longest_streak: 18,
      weak_areas_count: 3,
      strong_areas_count: 5
    };

    setTimeout(() => {
      setProgressData(mockProgressData);
      setWeakAreas(mockWeakAreas);
      setStudySessions(mockStudySessions);
      setPerformanceTrends(mockPerformanceTrends);
      setStudentSummary(mockStudentSummary);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6 h-96"></div>
              <div className="bg-white rounded-lg shadow p-6 h-96"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Track your progress and identify areas for improvement</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {studentSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(studentSummary.total_study_time / 60)}h
                    </p>
                    <p className="text-xs text-gray-500">This period</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average SAT Score</p>
                    <p className={`text-2xl font-bold ${getSatScoreColor(studentSummary.average_sat_score)}`}>
                      {studentSummary.average_sat_score}
                    </p>
                    <p className="text-xs text-gray-500">Target: 1400+</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Homework Completion</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(studentSummary.homework_completion_rate)}
                    </p>
                    <p className="text-xs text-gray-500">On-time rate</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {studentSummary.current_streak} days
                    </p>
                    <p className="text-xs text-gray-500">Best: {studentSummary.longest_streak}</p>
                  </div>
                  <Award className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          )}

          {/* Progress Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Progress Overview</h2>
              <button className="text-blue-600 hover:text-blue-700">
                <Eye className="h-4 w-4" />
              </button>
            </div>
            
            {/* Placeholder for actual chart */}
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Progress Chart</p>
                <p className="text-sm text-gray-500">Homework completion, SAT scores, study time, and flashcard mastery trends</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weak Areas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Areas to Improve</h2>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {weakAreas.length} areas
                </span>
              </div>
              
              <div className="space-y-4">
                {weakAreas.map((area, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(area.subject)}`}>
                          {area.subject}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{area.subcategory}</span>
                      </div>
                      <span className={`text-sm font-medium ${getAccuracyColor(area.accuracy_rate)}`}>
                        {formatPercentage(area.accuracy_rate)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${area.accuracy_rate}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{area.total_attempts} attempts</span>
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Suggestion:</strong> {area.improvement_suggestion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Study Sessions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Study Sessions</h2>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {studySessions.length} sessions
                </span>
              </div>
              
              <div className="space-y-4">
                {studySessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{session.session_type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDateTime(session.started_at)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">{session.duration_minutes} min</p>
                      </div>
                      {session.questions_attempted > 0 && (
                        <div>
                          <p className="text-gray-500">Questions</p>
                          <p className="font-medium text-gray-900">
                            {session.questions_correct}/{session.questions_attempted}
                          </p>
                        </div>
                      )}
                      {session.flashcards_reviewed > 0 && (
                        <div>
                          <p className="text-gray-500">Flashcards</p>
                          <p className="font-medium text-gray-900">{session.flashcards_reviewed}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Improving</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                  <span>Declining</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SAT Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Study Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceTrends.map((trend, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trend.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={getSatScoreColor(trend.score)}>{trend.score}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={getAccuracyColor(trend.accuracy)}>
                          {formatPercentage(trend.accuracy)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.study_time} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {index > 0 && getTrendIcon(trend.score, performanceTrends[index - 1].score)}
                          {index === 0 && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
