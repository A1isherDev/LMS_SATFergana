'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Award,
  Users,
  Target,
  BarChart3,
  Filter,
  Search,
  Medal,
  Star,
  Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/helpers';
import { rankingsApi } from '@/utils/api';

interface LeaderboardEntry {
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    bio?: string;
  };
  points: number;
  rank: number;
  period_type: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  trend: 'up' | 'down' | 'stable';
  previous_rank?: number;
  class_name?: string;
  study_time_minutes?: number;
  homework_completion_rate?: number;
  homework_accuracy?: number;
  mock_exam_count?: number;
}

interface RankingPeriod {
  type: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  label: string;
  description: string;
  start_date: string;
  end_date: string;
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'WEEKLY' | 'MONTHLY' | 'ALL_TIME'>('WEEKLY');
  const [periodInfo, setPeriodInfo] = useState<{ start: string; end: string } | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const periods: RankingPeriod[] = [
    {
      type: 'WEEKLY',
      label: 'Weekly',
      description: 'This week\'s top performers',
      start_date: '',
      end_date: ''
    },
    {
      type: 'MONTHLY',
      label: 'Monthly',
      description: 'This month\'s top performers',
      start_date: '',
      end_date: ''
    },
    {
      type: 'ALL_TIME',
      label: 'All Time',
      description: 'All-time highest achievers',
      start_date: '',
      end_date: ''
    }
  ];

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const data = await rankingsApi.getLeaderboard({ period_type: selectedPeriod, limit: 50 }) as any;
        setPeriodInfo({
          start: data.period_start,
          end: data.period_end
        });

        const transformedData = (data.leaderboard || []).map((entry: any) => ({
            student: {
              id: entry.student_id,
              first_name: entry.student_name?.split(' ')[0] || 'Student',
              last_name: entry.student_name?.split(' ').slice(1).join(' ') || '',
              email: entry.student_email,
              bio: entry.student_bio
            },
            points: entry.total_points,
            rank: entry.rank,
            period_type: selectedPeriod,
            trend: entry.rank_change_display || 'stable',
            previous_rank: entry.rank_change !== 0 ? entry.rank - entry.rank_change : undefined,
            class_name: entry.class_name || 'General',
            study_time_minutes: entry.study_time_minutes || 0,
            homework_completion_rate: entry.homework_completion_rate || 0,
            homework_accuracy: entry.homework_accuracy || 0,
            mock_exam_count: entry.mock_exam_count || 0
          }));

        setLeaderboard(transformedData);
        const uniqueClasses = [...new Set(transformedData.map((entry: LeaderboardEntry) => entry.class_name).filter(Boolean))] as string[];
        setAvailableClasses(uniqueClasses);
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setLeaderboard([]);
        setAvailableClasses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [selectedPeriod]);

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.class_name && entry.class_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.class_name && entry.class_name === selectedClass)
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
          {rank}
        </div>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-white text-gray-800 border-gray-200';
    }
  };

  const currentUserRank = leaderboard.find(entry => entry.student.id === user?.id);

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Rankings</h1>
              <p className="text-gray-600">Compete with students and track your progress</p>
            </div>
          </div>

          {/* Period Selection */}
          <div className="bg-card rounded-lg shadow p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Select Period</h2>
              <div className="text-sm text-muted-foreground">
                {periodInfo ? `${formatDate(periodInfo.start)} - ${formatDate(periodInfo.end)}` : 'Loading period...'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {periods.map((period) => (
                <button
                  key={period.type}
                  onClick={() => setSelectedPeriod(period.type)}
                  className={`p-4 rounded-lg border-2 transition-colors ${selectedPeriod === period.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-border hover:border-muted-foreground/30 bg-card'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{period.label}</h3>
                    {selectedPeriod === period.type && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{period.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Classes</option>
              {availableClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          {/* Current User Rank */}
          {currentUserRank && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Your Current Rank</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {getRankIcon(currentUserRank.rank)}
                      <span className="ml-2 text-2xl font-bold">#{currentUserRank.rank}</span>
                    </div>
                    <div className="text-sm">
                      <p className="opacity-90">{currentUserRank.points} points</p>
                      <div className="flex items-center mt-1">
                        {getTrendIcon(currentUserRank.trend)}
                        <span className="ml-1">
                          {currentUserRank.trend === 'stable' ? 'No change' :
                            currentUserRank.trend === 'up' ? `↑ from #${currentUserRank.previous_rank}` :
                              `↓ from #${currentUserRank.previous_rank}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span className="text-sm opacity-90">Top {Math.round((currentUserRank.rank / leaderboard.length) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {periods.find(p => p.type === selectedPeriod)?.label} Leaderboard
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredLeaderboard.map((entry, index) => (
                <div
                  key={entry.student.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${entry.student.id === user?.id ? 'bg-blue-50' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Student Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entry.student.first_name} {entry.student.last_name}
                          </h3>
                          {entry.student.id === user?.id && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        {entry.class_name && (
                          <p className="text-sm text-gray-500">{entry.class_name}</p>
                        )}
                        {entry.student.bio && (
                          <p className="text-xs text-gray-400 italic max-w-xs truncate" title={entry.student.bio}>
                            "{entry.student.bio}"
                          </p>
                        )}
                        {entry.study_time_minutes && entry.study_time_minutes > 0 && (
                          <p className="text-xs text-gray-400">
                            📚 {Math.floor(entry.study_time_minutes / 60)}h {entry.study_time_minutes % 60}m study time
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6">
                      {/* Trend */}
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(entry.trend)}
                          <span className={`text-sm font-medium ${getTrendColor(entry.trend)}`}>
                            {entry.trend === 'stable' ? '—' :
                              entry.trend === 'up' ? `+${entry.previous_rank! - entry.rank}` :
                                `-${entry.rank - entry.previous_rank!}`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">vs last period</p>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{entry.points}</p>
                        <p className="text-sm text-gray-500">points</p>
                      </div>

                      {/* Rank Badge */}
                      <div className={`px-3 py-1 rounded-full border-2 text-sm font-medium ${getRankBadgeColor(entry.rank)}`}>
                        #{entry.rank}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredLeaderboard.length === 0 && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'No rankings available for this period'}
              </p>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold text-foreground">{leaderboard.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </div>
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
                  <p className="text-2xl font-bold text-foreground">
                    {leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.points)) : 0}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-600 dark:text-green-400 opacity-50" />
              </div>
            </div>
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold text-foreground">
                    {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, e) => sum + e.points, 0) / leaderboard.length) : 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-50" />
              </div>
            </div>
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Study Time</p>
                  <p className="text-2xl font-bold text-foreground">
                    {leaderboard.length > 0 ?
                      (() => {
                        const totalMinutes = leaderboard.reduce((sum, e) => sum + (e.study_time_minutes || 0), 0);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                      })() : '0m'
                    }
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <span className="text-lg opacity-80">📚</span>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top 10% Cutoff</p>
                  <p className="text-2xl font-bold text-foreground">
                    {leaderboard.length > 0 ? leaderboard[Math.ceil(leaderboard.length * 0.1) - 1]?.points || 0 : 0}
                  </p>
                </div>
                <Award className="h-8 w-8 text-orange-600 dark:text-orange-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
