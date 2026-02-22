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
  Crown,
  Zap,
  RefreshCw,
  Loader
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/helpers';
import { rankingsApi } from '@/utils/api';
import toast from 'react-hot-toast';

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
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRanking, setCurrentUserRanking] = useState<LeaderboardEntry | undefined>(undefined);

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

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      // Fetch leaderboard and personal ranking in parallel
      const [leaderboardResponse, myRankingResponse] = await Promise.all([
        rankingsApi.getLeaderboard({ period_type: selectedPeriod, limit: 50 }),
        user?.role === 'STUDENT' ? rankingsApi.getMyRankings() : Promise.resolve(null)
      ]);

      const data: any = leaderboardResponse;

      if (data) {
        setPeriodInfo({
          start: data.period_start,
          end: data.period_end
        });

        const transformedData = data.leaderboard?.map((entry: any) => ({
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
        })) || [];

        setLeaderboard(transformedData);

        const uniqueClasses = [...new Set(transformedData.map((entry: LeaderboardEntry) => entry.class_name).filter(Boolean))] as string[];
        setAvailableClasses(uniqueClasses);

        // Process personal ranking if available
        if (myRankingResponse) {
          const myRankingData: any = myRankingResponse;
          let currentPeriodRank = null;

          if (selectedPeriod === 'WEEKLY') currentPeriodRank = myRankingData.weekly_ranking;
          else if (selectedPeriod === 'MONTHLY') currentPeriodRank = myRankingData.monthly_ranking;
          else if (selectedPeriod === 'ALL_TIME') currentPeriodRank = myRankingData.all_time_ranking;

          if (currentPeriodRank) {
            setCurrentUserRanking({
              student: {
                id: user!.id,
                first_name: user!.first_name,
                last_name: user!.last_name,
                email: user!.email,
                bio: user!.bio
              },
              points: currentPeriodRank.total_points,
              rank: currentPeriodRank.rank,
              period_type: selectedPeriod,
              trend: currentPeriodRank.rank_change_display || 'stable',
              previous_rank: currentPeriodRank.rank_change !== 0 ? currentPeriodRank.rank - currentPeriodRank.rank_change : undefined,
              class_name: 'My Class', // Placeholder as backend might not return class name in summary
              study_time_minutes: 0, // Placeholder
            });
          } else {
            setCurrentUserRanking(undefined);
          }
        }
      } else {
        setLeaderboard([]);
        setAvailableClasses([]);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast.error('Failed to load rankings');
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [selectedPeriod, user]); // Added user dependency

  const handleRecalculate = async () => {
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) return;

    setIsRecalculating(true);
    const toastId = toast.loading('Recalculating rankings...');

    try {
      await rankingsApi.updateRankings({
        period_type: selectedPeriod,
        force_recalculate: true
      });
      toast.success('Rankings updated successfully', { id: toastId });
      fetchRankings(); // Refresh data
    } catch (error: any) {
      console.error('Error recalculating rankings:', error);
      toast.error(`Failed to update: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsRecalculating(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter(entry => {
    const fullName = `${entry.student.first_name} ${entry.student.last_name}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || entry.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500 drop-shadow-lg" />;
      case 2:
        return <Medal className="h-8 w-8 text-slate-300 drop-shadow-sm" />;
      case 3:
        return <Medal className="h-8 w-8 text-orange-600 drop-shadow-sm" />;
      default:
        return null;
    }
  };

  // Use the separately fetched user ranking, or fall back to finding it in the loaded leaderboard
  const displayedUserRanking = currentUserRanking || leaderboard.find(entry => entry.student.id === user?.id);

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-48"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-[2.5rem]"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-3xl"></div>
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
        <div className="space-y-12 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Global Standings</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Leaderboard</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2">Scale the ranks by maintaining consistency and precision in your study blocks.</p>
            </div>
            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <button
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="flex items-center px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isRecalculating ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Recalculate
              </button>
            )}
          </div>

          {/* Period Selection Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {periods.map((period) => (
              <button
                key={period.type}
                onClick={() => setSelectedPeriod(period.type)}
                className={`p-8 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden group ${selectedPeriod === period.type
                  ? 'border-blue-600 bg-slate-900 text-white shadow-2xl scale-[1.02]'
                  : 'border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-slate-600 hover:border-slate-200'
                  }`}
              >
                <div className="relative z-10">
                  <h3 className={`text-xl font-black uppercase italic mb-2 ${selectedPeriod === period.type ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {period.label}
                  </h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedPeriod === period.type ? 'text-blue-400' : 'text-slate-400'}`}>
                    {period.description}
                  </p>
                </div>
                {selectedPeriod === period.type && (
                  <Zap className="absolute -right-4 -bottom-4 h-24 w-24 text-blue-500 opacity-10" />
                )}
              </button>
            ))}
          </div>

          {/* Quick Filter & Search */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students or classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm text-slate-900 dark:text-white"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">Every Division</option>
              {availableClasses.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          {/* Current User Spotlight */}
          {displayedUserRanking && (
            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                <Trophy className="h-32 w-32" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black italic">
                    #{displayedUserRanking.rank}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 block mb-1">Your Standing</span>
                    <h3 className="text-2xl font-black uppercase italic italic tracking-tighter">Current Status</h3>
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-black italic">{displayedUserRanking.points}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Total Points</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(displayedUserRanking.trend)}
                      <p className="text-3xl font-black italic">
                        {displayedUserRanking.trend === 'stable' ? '—' :
                          displayedUserRanking.trend === 'up' && displayedUserRanking.previous_rank
                            ? `+${displayedUserRanking.previous_rank - displayedUserRanking.rank}`
                            : displayedUserRanking.previous_rank
                              ? `-${displayedUserRanking.rank - displayedUserRanking.previous_rank}`
                              : '—'}
                      </p>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Velocity</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Leaderboard Table */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-900">
              {filteredLeaderboard.map((entry) => (
                <div
                  key={entry.student.id}
                  className={`group p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all ${entry.student.id === user?.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                >
                  <div className="flex items-center gap-8 flex-1">
                    {/* Rank Indicator */}
                    <div className="w-12 flex flex-col items-center">
                      <span className={`text-2xl font-black italic ${entry.rank <= 3 ? 'text-blue-600' : 'text-slate-300'}`}>
                        {entry.rank}
                      </span>
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Student Identity */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                          {entry.student.first_name} {entry.student.last_name}
                        </h4>
                        {entry.student.id === user?.id && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-md uppercase tracking-widest">Self</span>
                        )}
                        {entry.rank === 1 && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>
                      <div className="flex gap-4 items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.class_name}</p>
                        {entry.study_time_minutes !== undefined && entry.study_time_minutes > 0 && (
                          <span className="text-[9px] font-black text-slate-300 uppercase italic">
                            {Math.floor(entry.study_time_minutes / 60)}h study block
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Operational Data */}
                  <div className="flex items-center gap-12">
                    <div className="hidden md:block text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {getTrendIcon(entry.trend)}
                        <span className="text-lg font-black italic text-slate-900 dark:text-white">
                          {entry.trend === 'stable' ? '0' :
                            entry.trend === 'up' && entry.previous_rank
                              ? entry.previous_rank - entry.rank
                              : entry.previous_rank
                                ? entry.rank - entry.previous_rank
                                : '0'}
                        </span>
                      </div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Trend</p>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <p className="text-2xl font-black italic text-slate-900 dark:text-white">{entry.points}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Acquired Points</p>
                    </div>

                    <div className="flex gap-2">
                      {entry.rank <= 3 && (
                        <div className={`p-3 rounded-xl ${entry.rank === 1 ? 'bg-yellow-50 text-yellow-600' :
                          entry.rank === 2 ? 'bg-slate-50 text-slate-400' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                          <Medal className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLeaderboard.length === 0 && (
              <div className="py-32 text-center">
                <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Trophy className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Zero Data Points</h3>
                <p className="text-slate-400 font-medium italic mt-2">Adjust your query filters or wait for session sync.</p>
              </div>
            )}
          </div>

          {/* Macro Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Learners', value: leaderboard.length, icon: Users, color: 'text-blue-500' },
              { label: 'Top Accuracy', value: leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.homework_accuracy || 0)) + '%' : '0%', icon: Target, color: 'text-emerald-500' },
              { label: 'High Velocity', value: leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.points)) : 0, icon: Zap, color: 'text-orange-500' },
              { label: 'Mean Intensity', value: leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, e) => sum + e.points, 0) / leaderboard.length) : 0, icon: BarChart3, color: 'text-purple-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                <stat.icon className={`absolute -right-2 -bottom-2 h-16 w-16 ${stat.color} opacity-5 group-hover:scale-110 transition-transform`} />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
                <p className="text-3xl font-black italic text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
