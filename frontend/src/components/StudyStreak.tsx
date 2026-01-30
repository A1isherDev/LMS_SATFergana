'use client';

import { useState, useEffect } from 'react';
import { Award, Flame, Calendar, TrendingUp, Clock } from 'lucide-react';

interface StudyStreakProps {
  streakDays: number;
  studyTimeToday: number;
  className?: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  averageDailyTime: number;
  thisWeekStudy: number;
  lastWeekStudy: number;
}

export default function StudyStreak({ streakDays, studyTimeToday, className = '' }: StudyStreakProps) {
  const [mounted, setMounted] = useState(false);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: streakDays,
    longestStreak: 0,
    totalStudyDays: 0,
    averageDailyTime: 0,
    thisWeekStudy: 0,
    lastWeekStudy: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStreakColor = (days: number): string => {
    if (days >= 30) return 'text-purple-600';
    if (days >= 14) return 'text-blue-600';
    if (days >= 7) return 'text-green-600';
    if (days >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStreakMessage = (days: number): string => {
    if (days === 0) return 'Start your streak today!';
    if (days === 1) return 'Great start! Keep it going!';
    if (days < 7) return `${days} day streak! Building momentum!`;
    if (days < 14) return `${days} day streak! You're on fire!`;
    if (days < 30) return `${days} day streak! Incredible consistency!`;
    return `${days} day streak! You're a study legend!`;
  };

  const getStreakIcon = (days: number) => {
    if (days >= 30) return <Flame className="h-6 w-6 text-purple-600" />;
    if (days >= 14) return <Flame className="h-6 w-6 text-blue-600" />;
    if (days >= 7) return <Flame className="h-6 w-6 text-green-600" />;
    if (days >= 3) return <Flame className="h-6 w-6 text-yellow-600" />;
    return <Flame className="h-6 w-6 text-gray-400" />;
  };

  const getWeeklyProgress = () => {
    if (streakData.lastWeekStudy === 0) return 100;
    return Math.round(((streakData.thisWeekStudy - streakData.lastWeekStudy) / streakData.lastWeekStudy) * 100);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!mounted) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const weeklyProgress = getWeeklyProgress();

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Study Streak</p>
            <div className="flex items-center space-x-2">
              {getStreakIcon(streakDays)}
              <p className={`text-2xl font-bold ${getStreakColor(streakDays)}`}>
                {streakDays} days
              </p>
            </div>
            <p className="text-xs text-gray-500">{getStreakMessage(streakDays)}</p>
          </div>
          <Award className="h-8 w-8 text-gray-400" />
        </div>

        {/* Today's Progress */}
        <div className="border-t pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Today's Study</span>
            <span className="text-sm font-medium text-gray-900">
              {formatTime(studyTimeToday)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((studyTimeToday / 120) * 100, 100)}%` 
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Goal: 2 hours</p>
        </div>

        {/* Weekly Comparison */}
        <div className="border-t pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">This Week vs Last Week</span>
            <div className="flex items-center space-x-1">
              {weeklyProgress > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
              )}
              <span className={`text-sm font-medium ${
                weeklyProgress > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyProgress > 0 ? '+' : ''}{weeklyProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Milestones</p>
          <div className="space-y-2">
            {[
              { days: 3, label: '3 Days', achieved: streakDays >= 3, color: 'bg-yellow-100 text-yellow-800' },
              { days: 7, label: '1 Week', achieved: streakDays >= 7, color: 'bg-green-100 text-green-800' },
              { days: 14, label: '2 Weeks', achieved: streakDays >= 14, color: 'bg-blue-100 text-blue-800' },
              { days: 30, label: '1 Month', achieved: streakDays >= 30, color: 'bg-purple-100 text-purple-800' },
            ].map((milestone) => (
              <div key={milestone.days} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.achieved ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={`text-sm ${
                    milestone.achieved ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {milestone.label}
                  </span>
                </div>
                {milestone.achieved && (
                  <span className={`text-xs px-2 py-1 rounded-full ${milestone.color}`}>
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Message */}
        {streakDays === 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💪 Start your study streak today! Even 15 minutes counts.
            </p>
          </div>
        )}

        {streakDays >= 1 && streakDays < 7 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              🔥 Great momentum! Keep the streak going!
            </p>
          </div>
        )}

        {streakDays >= 7 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">
              🏆 Incredible consistency! You're building amazing study habits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
