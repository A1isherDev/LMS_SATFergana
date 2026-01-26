'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Calendar,
  Award,
  Brain,
  AlertCircle,
  CheckCircle,
  Play
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDaysUntilExam, getExamUrgency, getStreakMessage, getStreakColor, getSatScoreColor, formatPercentage, formatDuration } from '@/utils/helpers';
import { getFutureDate, getPastDate } from '@/utils/dateFixer';

interface DashboardStats {
  homeworkCompletion: number;
  averageScore: number;
  studyStreak: number;
  studyTimeToday: number;
  nextExamDate: string;
  weakAreas: string[];
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch real dashboard data from API
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/analytics/dashboard/stats/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback to mock data if API fails
          const mockStats: DashboardStats = {
            homeworkCompletion: 85,
            averageScore: 1250,
            studyStreak: 12,
            studyTimeToday: 45,
            nextExamDate: getFutureDate(120),
            weakAreas: ['Algebra', 'Geometry'],
            recentActivity: [
              {
                type: 'homework',
                description: 'Completed Math Homework #3',
                timestamp: `${getPastDate(1)}T10:30:00Z`
              },
              {
                type: 'mock_exam',
                description: 'Scored 1320 on Practice Test',
                timestamp: `${getPastDate(1)}T09:15:00Z`
              },
              {
                type: 'flashcard',
                description: 'Reviewed 50 vocabulary cards',
                timestamp: `${getPastDate(2)}T20:45:00Z`
              }
            ]
          };
          setStats(mockStats);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to mock data
        const mockStats: DashboardStats = {
          homeworkCompletion: 85,
          averageScore: 1250,
          studyStreak: 12,
          studyTimeToday: 45,
          nextExamDate: getFutureDate(120),
          weakAreas: ['Algebra', 'Geometry'],
          recentActivity: [
            {
              type: 'homework',
              description: 'Completed Math Homework #3',
              timestamp: `${getPastDate(1)}T10:30:00Z`
            },
              {
              type: 'mock_exam',
              description: 'Scored 1320 on Practice Test',
              timestamp: `${getPastDate(1)}T09:15:00Z`
            },
            {
              type: 'flashcard',
              description: 'Reviewed 50 vocabulary cards',
              timestamp: `${getPastDate(2)}T20:45:00Z`
            }
          ]
        };
        setStats(mockStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const daysUntilExam = stats ? getDaysUntilExam(stats.nextExamDate) : 0;
  const examUrgency = getExamUrgency(daysUntilExam);

  const handlePracticeClick = () => {
    router.push('/questionbank');
  };

  const handleMockExamClick = () => {
    router.push('/mockexams');
  };

  const handleFlashcardsClick = () => {
    router.push('/flashcards');
  };

  const handleAnalyticsClick = () => {
    router.push('/analytics');
  };

  const handleWeakAreaPractice = (area: string) => {
    router.push(`/questionbank?subject=${encodeURIComponent(area)}`);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'homework':
        return <BookOpen className="h-4 w-4" />;
      case 'exam':
        return <Target className="h-4 w-4" />;
      case 'flashcard':
        return <Brain className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
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
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!stats) return null;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Days Until Exam */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Days Until Exam</p>
                  <p className={`text-2xl font-bold ${examUrgency.color}`}>
                    {daysUntilExam}
                  </p>
                  <p className="text-xs text-gray-500">{examUrgency.level} Priority</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Study Streak */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Study Streak</p>
                  <p className={`text-2xl font-bold ${getStreakColor(stats.studyStreak)}`}>
                    {stats.studyStreak} days
                  </p>
                  <p className="text-xs text-gray-500">{getStreakMessage(stats.studyStreak)}</p>
                </div>
                <Award className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Average SAT Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className={`text-2xl font-bold ${getSatScoreColor(stats.averageScore)}`}>
                    {stats.averageScore}
                  </p>
                  <p className="text-xs text-gray-500">Target: 1400+</p>
                </div>
                <Target className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {/* Today's Study Time */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Study</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatDuration(stats.studyTimeToday)}
                  </p>
                  <p className="text-xs text-gray-500">Goal: 2 hours</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Homework Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Homework Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                    <span className="text-sm text-gray-500">{formatPercentage(stats.homeworkCompletion)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.homeworkCompletion}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">17 of 20 assignments completed</span>
                </div>
              </div>
            </div>

            {/* Weak Areas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas to Improve</h3>
              <div className="space-y-3">
                {stats.weakAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-800">{area}</span>
                    </div>
                    <button 
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                      onClick={() => handleWeakAreaPractice(area)}
                    >
                      Practice
                    </button>
                  </div>
                ))}
                {stats.weakAreas.length === 0 && (
                  <p className="text-sm text-gray-500">No weak areas identified. Keep up the great work!</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                onClick={handlePracticeClick}
              >
                <Play className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-900">Start Practice</span>
              </button>
              <button 
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                onClick={handleMockExamClick}
              >
                <Target className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-900">Take Mock Exam</span>
              </button>
              <button 
                className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                onClick={handleFlashcardsClick}
              >
                <Brain className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-900">Review Flashcards</span>
              </button>
              <button 
                className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                onClick={handleAnalyticsClick}
              >
                <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-orange-900">View Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
