'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Target,
  BookOpen,
  Award,
  AlertTriangle,
  Activity,
  Download,
  Eye,
  Loader2,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime, formatPercentage, getSatScoreColor, getSubjectColor } from '../../utils/helpers';
import { analyticsApi } from '../../utils/api';

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
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);

        // Fetch analytics data with individual error handling
        let weakAreasData: WeakArea[] = [];
        let sessionsData: StudySession[] = [];
        let trendsData: PerformanceTrend[] = [];
        let summaryData: StudentSummary | null = null;

        // Try to fetch weak areas
        try {
          const weakAreasResponse = await analyticsApi.getMyWeakAreas() as { results?: WeakArea[] } | WeakArea[];
          weakAreasData = Array.isArray(weakAreasResponse) ? weakAreasResponse : weakAreasResponse.results || [];
        } catch (error) {
          console.log('Weak areas endpoint not available, using empty data');
        }

        // Try to fetch sessions
        try {
          const sessionsResponse = await analyticsApi.getMySessions() as { results?: StudySession[] } | StudySession[];
          sessionsData = Array.isArray(sessionsResponse) ? sessionsResponse : sessionsResponse.results || [];
        } catch (error) {
          console.log('Sessions endpoint not available, using empty data');
        }

        // Try to fetch performance trends
        try {
          const trendsResponse = await analyticsApi.getPerformanceTrends({ period_type: selectedPeriod.toUpperCase() }) as { results?: PerformanceTrend[] } | PerformanceTrend[];
          trendsData = Array.isArray(trendsResponse) ? trendsResponse : trendsResponse.results || [];
        } catch (error) {
          console.log('Performance trends endpoint not available, using empty data');
        }

        // Try to fetch student summary
        try {
          summaryData = await analyticsApi.getStudentSummary() as StudentSummary;
        } catch (error) {
          console.log('Student summary endpoint not available');
        }

        setWeakAreas(weakAreasData);
        setStudySessions(sessionsData);
        setPerformanceTrends(trendsData);
        setStudentSummary(summaryData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Set empty data on error
        // setProgressData([]);
        setWeakAreas([]);
        setStudySessions([]);
        setPerformanceTrends([]);
        setStudentSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedPeriod]);

  const handleExport = async () => {
    const toastId = toast.loading('Generating analytics report...');
    try {
      const response = await analyticsApi.exportAnalytics();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to generate report. Please try again later.', { id: toastId });
    }
  };

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
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
            <div className="relative">
              <div className="h-24 w-24 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Analyzing Metrics</p>
              <p className="text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">Aggregating Performance Data...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Performance Intelligence</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Mission Analytics</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2 italic">Comprehensive analysis of your educational trajectory and accuracy parameters.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleExport}
                className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Logic (CSV)
              </button>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter')}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                <option value="week">Weekly Pulse</option>
                <option value="month">Monthly Insight</option>
                <option value="quarter">Quarterly Macro</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {studentSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Study Protocol', val: `${Math.round(studentSummary.total_study_time / 60)}h`, sub: 'Active Duty', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Consolidated SAT', val: studentSummary.average_sat_score, sub: 'Target: 1400+', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50', customVal: getSatScoreColor(studentSummary.average_sat_score) },
                { label: 'Syllabus Clarity', val: formatPercentage(studentSummary.homework_completion_rate), sub: 'On-time Rate', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Consistency', val: `${studentSummary.current_streak}d`, sub: `Best: ${studentSummary.longest_streak}d`, icon: Award, color: 'text-orange-500', bg: 'bg-orange-50' }
              ].map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-4 ${card.bg} dark:bg-opacity-10 rounded-2xl shadow-sm`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                  </div>
                  <div>
                    <span className={`text-4xl font-black italic text-slate-900 dark:text-white ${card.customVal || ''}`}>{card.val}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter italic">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-gray-700 p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity className="h-32 w-32 text-blue-600" />
            </div>

            <div className="flex items-center justify-between mb-12 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Mastery Projection</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Core SAT score distribution over the {selectedPeriod}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            {performanceTrends.length > 0 ? (
              <div className="h-80 flex items-end justify-between gap-4 px-4 relative z-10">
                {performanceTrends.map((trend, idx) => {
                  const height = (trend.score / 1600) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10 shadow-2xl scale-75 group-hover:scale-100">
                        {trend.score} PTS
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                      </div>

                      <div
                        className={`w-full rounded-2xl transition-all duration-700 hover:scale-x-105 cursor-pointer shadow-lg ${trend.score >= 1200 ? 'bg-gradient-to-t from-blue-700 via-blue-500 to-blue-300 shadow-blue-500/20' :
                          trend.score >= 1000 ? 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-200 shadow-emerald-500/20' :
                            'bg-gradient-to-t from-red-600 via-orange-400 to-amber-200 shadow-orange-500/20'
                          }`}
                        style={{ height: `${height}%` }}
                      ></div>

                      <span className="mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest overflow-hidden text-ellipsis w-full text-center italic">
                        {trend.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-80 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] flex flex-col items-center justify-center border-2 border-slate-100 dark:border-gray-800 border-dashed">
                <BarChart3 className="h-12 w-12 text-slate-200 dark:text-gray-700 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] italic">No trend data available yet</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Weak Areas */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Strategic Deficits</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Identify and neutralize weak points</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 text-[8px] font-black bg-red-500 text-white rounded-lg uppercase italic tracking-widest shadow-sm">
                    {weakAreas.length} CRITICAL
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {weakAreas.length > 0 ? (
                  weakAreas.map((area, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-gray-700 hover:border-red-400 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-[8px] font-black rounded-lg uppercase tracking-wider ${getSubjectColor(area.subject)}`}>
                            {area.subject}
                          </span>
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{area.subcategory}</span>
                        </div>
                        <span className={`text-sm font-black italic ${getAccuracyColor(area.accuracy_rate)}`}>
                          {formatPercentage(area.accuracy_rate)}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-4">
                        <div
                          className="bg-red-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          style={{ width: `${area.accuracy_rate}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        <span className="flex items-center"><Target className="h-3 w-3 mr-1" /> {area.total_attempts} Attempts</span>
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      </div>

                      <div className="bg-blue-600/5 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100/50 dark:border-blue-900/30">
                        <p className="text-[10px] text-blue-900 dark:text-blue-300 font-bold leading-relaxed italic">
                          <strong className="uppercase mr-1 tracking-widest text-[9px]">Practice Recommendation:</strong> {area.improvement_suggestion}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border-2 border-dashed border-emerald-100 dark:border-emerald-800/20">
                    <CheckCircle className="h-12 w-12 text-emerald-500 opacity-20 mx-auto mb-4" />
                    <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase italic">Perfect Baseline</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">No strategic deficits detected.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Study Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Session Archive</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Log of your recent educational activity</p>
                </div>
                {studySessions.length > 0 && (
                  <span className="px-3 py-1 text-[8px] font-black bg-blue-600 text-white rounded-lg uppercase italic tracking-widest shadow-sm">
                    {studySessions.length} RECORDS
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {studySessions.length > 0 ? (
                  studySessions.map((session) => (
                    <div key={session.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-50 dark:border-gray-700 hover:border-blue-400/50 transition-all flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-600">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{session.session_type.replace('_', ' ')}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {formatDateTime(session.started_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-right">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DURATION</p>
                          <p className="text-[11px] font-black text-slate-900 dark:text-white italic">{session.duration_minutes}m</p>
                        </div>
                        {session.questions_attempted > 0 && (
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PRECISION</p>
                            <p className="text-[11px] font-black text-emerald-600 italic">
                              {session.questions_correct}/{session.questions_attempted}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-gray-800">
                    <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4 opacity-50" />
                    <h3 className="text-sm font-black text-slate-400 uppercase italic">No Activities Recorded</h3>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Trends Table */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Velocity Metrics</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Tabular breakdown of performance maturation</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ascending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descending</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-gray-700">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    {['Period', 'SAT Score', 'Accuracy', 'Active Duty', 'Momentum'].map((head) => (
                      <th key={head} className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-slate-50 dark:divide-gray-700">
                  {performanceTrends.map((trend, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-8 py-6 whitespace-nowrap text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                        {trend.period}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`text-base font-black italic tracking-tighter ${getSatScoreColor(trend.score)}`}>{trend.score}</span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`text-[11px] font-black italic ${getAccuracyColor(trend.accuracy)}`}>
                          {formatPercentage(trend.accuracy)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-[11px] font-black text-slate-500 italic">
                        {trend.study_time} MIN
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          {index > 0 && getTrendIcon(trend.score, performanceTrends[index - 1].score)}
                          {index === 0 && <span className="text-slate-200">—</span>}
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
