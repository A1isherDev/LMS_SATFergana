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

interface LeaderboardEntry {
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  points: number;
  rank: number;
  period_type: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  trend: 'up' | 'down' | 'stable';
  previous_rank?: number;
  class_name?: string;
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
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const periods: RankingPeriod[] = [
    {
      type: 'WEEKLY',
      label: 'Weekly',
      description: 'This week\'s top performers',
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString()
    },
    {
      type: 'MONTHLY',
      label: 'Monthly',
      description: 'This month\'s top performers',
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString()
    },
    {
      type: 'ALL_TIME',
      label: 'All Time',
      description: 'All-time highest achievers',
      start_date: '2024-01-01T00:00:00Z',
      end_date: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // TODO: Fetch actual rankings from API
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        student: {
          id: 1,
          first_name: 'Emma',
          last_name: 'Johnson',
          email: 'emma@example.com'
        },
        points: 2450,
        rank: 1,
        period_type: selectedPeriod,
        trend: 'up',
        previous_rank: 3,
        class_name: 'SAT Math - Advanced'
      },
      {
        student: {
          id: 2,
          first_name: 'Michael',
          last_name: 'Chen',
          email: 'michael@example.com'
        },
        points: 2380,
        rank: 2,
        period_type: selectedPeriod,
        trend: 'stable',
        previous_rank: 2,
        class_name: 'SAT Reading & Writing'
      },
      {
        student: {
          id: 3,
          first_name: 'Sarah',
          last_name: 'Williams',
          email: 'sarah@example.com'
        },
        points: 2290,
        rank: 3,
        period_type: selectedPeriod,
        trend: 'down',
        previous_rank: 1,
        class_name: 'SAT Math - Advanced'
      },
      {
        student: {
          id: 4,
          first_name: 'David',
          last_name: 'Brown',
          email: 'david@example.com'
        },
        points: 2150,
        rank: 4,
        period_type: selectedPeriod,
        trend: 'up',
        previous_rank: 6,
        class_name: 'SAT Math - Advanced'
      },
      {
        student: {
          id: 5,
          first_name: 'Lisa',
          last_name: 'Anderson',
          email: 'lisa@example.com'
        },
        points: 2080,
        rank: 5,
        period_type: selectedPeriod,
        trend: 'up',
        previous_rank: 8,
        class_name: 'SAT Reading & Writing'
      },
      {
        student: {
          id: 6,
          first_name: 'James',
          last_name: 'Taylor',
          email: 'james@example.com'
        },
        points: 1950,
        rank: 6,
        period_type: selectedPeriod,
        trend: 'stable',
        previous_rank: 6,
        class_name: 'SAT Math - Advanced'
      },
      {
        student: {
          id: 7,
          first_name: 'Olivia',
          last_name: 'Martinez',
          email: 'olivia@example.com'
        },
        points: 1820,
        rank: 7,
        period_type: selectedPeriod,
        trend: 'down',
        previous_rank: 5,
        class_name: 'SAT Reading & Writing'
      },
      {
        student: {
          id: 8,
          first_name: 'Daniel',
          last_name: 'Wilson',
          email: 'daniel@example.com'
        },
        points: 1750,
        rank: 8,
        period_type: selectedPeriod,
        trend: 'stable',
        previous_rank: 8,
        class_name: 'SAT Math - Advanced'
      }
    ];

    setTimeout(() => {
      setLeaderboard(mockLeaderboard);
      setIsLoading(false);
    }, 1000);
  }, [selectedPeriod]);

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.class_name && entry.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Select Period</h2>
              <div className="text-sm text-gray-500">
                {formatDate(periods.find(p => p.type === selectedPeriod)?.start_date || '')} - {formatDate(periods.find(p => p.type === selectedPeriod)?.end_date || '')}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {periods.map((period) => (
                <button
                  key={period.type}
                  onClick={() => setSelectedPeriod(period.type)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedPeriod === period.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{period.label}</h3>
                    {selectedPeriod === period.type && (
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{period.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              <option value="SAT Math - Advanced">SAT Math - Advanced</option>
              <option value="SAT Reading & Writing">SAT Reading & Writing</option>
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {periods.find(p => p.type === selectedPeriod)?.label} Leaderboard
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredLeaderboard.map((entry, index) => (
                <div
                  key={entry.student.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    entry.student.id === user?.id ? 'bg-blue-50' : ''
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900">{leaderboard.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Highest Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.points)) : 0}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, e) => sum + e.points, 0) / leaderboard.length) : 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top 10% Cutoff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaderboard.length > 0 ? leaderboard[Math.ceil(leaderboard.length * 0.1) - 1]?.points || 0 : 0}
                  </p>
                </div>
                <Award className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
