'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, analyticsApi, bluebookApi } from '../../utils/api';
import {
  BookOpen,
  Target,
  Brain,
  Play
} from 'lucide-react';

import StudentDashboard from '../../components/dashboards/StudentDashboard';
import TeacherDashboard from '../../components/dashboards/TeacherDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<Record<string, unknown> | null>(null);

  // Admin must use Admin Panel only — redirect to /admin
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user?.role, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') return;

    const fetchData = async () => {
      try {
        if (user?.role === 'STUDENT') {
          try {
            const profileData = await usersApi.getStudentProfile() as Record<string, unknown>;
            setStudentProfile(profileData);
          } catch {
            // optional
          }
        }

        const data = await analyticsApi.getDashboardStats() as Record<string, unknown>;

        if (user?.role === 'STUDENT') {
          let digitalSatData = { attempts: 0, averageScore: 0, bestScore: 0 };
          try {
            const satAnalytics = await bluebookApi.getAnalytics() as Record<string, unknown>;
            digitalSatData = {
              attempts: (satAnalytics.total_attempts as number) || 0,
              averageScore: (satAnalytics.average_total_score as number) || 0,
              bestScore: (satAnalytics.highest_score as number) || 0
            };
          } catch {
            // optional
          }
          setStats({
            ...data,
            digitalSatAttempts: digitalSatData.attempts,
            digitalSatAverageScore: digitalSatData.averageScore,
            digitalSatBestScore: digitalSatData.bestScore,
            nextExamDate: data.nextExamDate ?? (studentProfile as any)?.sat_exam_date ?? null,
            weakAreas: Array.isArray(data.weakAreas) ? data.weakAreas : [],
          });
        } else {
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, studentProfile?.sat_exam_date]);

  const handleSessionUpdate = () => {
    window.location.reload();
  };

  const handleWeakAreaPractice = (area: string) => {
    router.push(`/questionbank?subject=${encodeURIComponent(area)}`);
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'homework': return <BookOpen className="h-4 w-4" />;
      case 'exam': return <Target className="h-4 w-4" />;
      case 'flashcard': return <Brain className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  if (user?.role === 'ADMIN' || isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
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
        {user?.role === 'STUDENT' && stats && (
          <StudentDashboard
            stats={stats as any}
            studentProfile={studentProfile}
            handleSessionUpdate={handleSessionUpdate}
            handleWeakAreaPractice={handleWeakAreaPractice}
            getActivityIcon={getActivityIcon}
          />
        )}

        {user?.role === 'TEACHER' && stats && (
          <TeacherDashboard stats={stats as any} />
        )}

        {!stats && user?.role !== 'ADMIN' && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome, {user?.first_name || 'User'}!</h2>
            <p className="text-gray-500 mb-6">We couldn't load your personalized dashboard stats right now.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
