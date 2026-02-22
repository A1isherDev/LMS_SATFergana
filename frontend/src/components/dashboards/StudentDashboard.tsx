import React from 'react';
import {
    Clock,
    Target,
    TrendingUp,
    BookOpen,
    Award,
    Brain,
    AlertCircle,
    CheckCircle,
    Play,
    Calendar,
    ChevronRight,
    LineChart,
    ClipboardList,
    ArrowRight,
    Zap,
    Trophy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ExamCountdown from '../ExamCountdown';
import StudyStreak from '../StudyStreak';
import StudySessionTracker from '../StudySessionTracker';
import ProgressChart from '../ProgressChart';
import { getSatScoreColor, formatPercentage, formatDuration } from '../../utils/helpers';

interface StudentDashboardProps {
    stats: {
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
        digitalSatAttempts?: number;
        digitalSatAverageScore?: number;
        digitalSatBestScore?: number;
        upcomingDeadlines?: Array<{
            id: number;
            title: string;
            due_date: string;
            days_left: number;
        }>;
        nextAssignment?: {
            id: number;
            title: string;
            due_date: string;
            days_left: number;
        };
        scoreTrend?: Array<{
            id: number;
            score: number;
            date: string;
            exam_title: string;
        }>;
    };
    studentProfile: any;
    handleSessionUpdate: () => void;
    handleWeakAreaPractice: (area: string) => void;
    getActivityIcon: (type: string) => React.ReactNode;
}

export default function StudentDashboard({
    stats,
    studentProfile,
    handleSessionUpdate,
    handleWeakAreaPractice,
    getActivityIcon
}: StudentDashboardProps) {
    const router = useRouter();

    const handlePracticeClick = () => router.push('/questionbank');
    const handleMockExamClick = () => router.push('/mockexams');
    const handleFlashcardsClick = () => router.push('/flashcards');
    const handleAnalyticsClick = () => router.push('/analytics');

    return (
        <div className="space-y-8 pb-12">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ExamCountdown
                    examDate={studentProfile?.sat_exam_date || null}
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8"
                />

                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl shadow-sm">
                            <Zap className="h-6 w-6 text-orange-500" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Study Streak</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white italic">{stats.studyStreak} Days</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Consistency Is King</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl shadow-sm">
                            <Target className="h-6 w-6 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Score</span>
                    </div>
                    <div>
                        <span className={`text-3xl font-black italic ${getSatScoreColor(stats.averageScore)}`}>
                            {stats.averageScore}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Target: 1450+</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl shadow-sm">
                            <Clock className="h-6 w-6 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today&apos;s Focus</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white italic">
                            {formatDuration(stats.studyTimeToday)}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Goal: 2.5 Hours</p>
                    </div>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Digital SAT Card - Premium Style */}
                <div className="bg-slate-900 rounded-[2.5rem] shadow-xl p-8 space-y-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy className="h-32 w-32 text-blue-400" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-3 text-blue-400" />
                            Digital SAT Outlook
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5">
                                <div>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Best Performance</p>
                                    <p className="text-2xl font-black italic text-blue-400">{stats.digitalSatBestScore || '---'}</p>
                                </div>
                                <Award className="h-8 w-8 text-blue-400 opacity-50" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/5 text-center">
                                    <p className="text-[9px] font-black text-white/50 uppercase tracking-tighter mb-1">Total Attempts</p>
                                    <p className="text-xl font-black italic">{stats.digitalSatAttempts || 0}</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/5 text-center">
                                    <p className="text-[9px] font-black text-white/50 uppercase tracking-tighter mb-1">Avg. Readiness</p>
                                    <p className="text-xl font-black italic">{stats.digitalSatAverageScore || 0}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/mockexams/bluebook')}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-500 hover:scale-[1.02] transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center group"
                            >
                                <Play className="h-4 w-4 mr-2 group-hover:fill-current" />
                                Initiate Bluebook Sim
                            </button>
                        </div>
                    </div>
                </div>

                {/* Homework Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Study Completion</h3>
                    <div className="space-y-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Progress</p>
                                <span className="text-sm font-black text-blue-600 italic">{formatPercentage(stats.homeworkCompletion)}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all duration-700"
                                    style={{ width: `${stats.homeworkCompletion}%` }}
                                ></div>
                            </div>
                        </div>

                        {stats.nextAssignment ? (
                            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex flex-col justify-between h-40">
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Priority Module</p>
                                    <h4 className="text-base font-black text-blue-900 dark:text-blue-200 uppercase leading-none tracking-tighter">{stats.nextAssignment.title}</h4>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 italic">DUE IN {stats.nextAssignment.days_left} DAYS</span>
                                    <button
                                        onClick={() => router.push(`/homework`)}
                                        className="p-3 bg-blue-600 text-white rounded-xl hover:scale-110 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                                <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase italic">Syllabus Fully Cleared</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Weak Areas - Actionable */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 space-y-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Weak Points</h3>
                    <div className="space-y-3">
                        {stats.weakAreas.length > 0 ? (
                            stats.weakAreas.map((area, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 group hover:bg-white dark:hover:bg-red-900/20 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-red-800 dark:text-red-400 uppercase tracking-tight leading-none">{area}</span>
                                            <span className="text-[8px] text-red-400 font-bold uppercase mt-1 tracking-tighter">High priority focus</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-[9px] font-black text-red-600 dark:text-red-400 uppercase italic tracking-widest rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                            onClick={() => handleWeakAreaPractice(area)}
                                        >
                                            Practice Questions
                                        </button>
                                        <button
                                            className="p-1.5 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm"
                                            title="Practice Flashcards"
                                            onClick={() => router.push(`/flashcards?subject=${encodeURIComponent(area.split(' - ')[0])}`)}
                                        >
                                            <Brain className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Award className="h-10 w-10 text-blue-200 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No weak areas detected yet. Excellent baseline.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Row: Trends & Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Score Chart - Enhanced */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8">
                    <ProgressChart
                        title="Mastery Progression"
                        data={stats.scoreTrend?.map(s => ({
                            label: s.date ? s.date.split('-').slice(1).join('/') : 'N/A',
                            value: s.score
                        })) || []}
                        maxValue={1600}
                        unit=" pts"
                        type="area"
                        trend={
                            !stats.scoreTrend || stats.scoreTrend.length < 2 ? 'stable' :
                                stats.scoreTrend[stats.scoreTrend.length - 1].score > stats.scoreTrend[stats.scoreTrend.length - 2].score ? 'up' :
                                    stats.scoreTrend[stats.scoreTrend.length - 1].score < stats.scoreTrend[stats.scoreTrend.length - 2].score ? 'down' : 'stable'
                        }
                    />
                </div>

                <StudySessionTracker
                    onSessionUpdate={handleSessionUpdate}
                    className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8"
                />
            </div>

            {/* Quick Navigation Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-8">Dynamic Learning Suite</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <button className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl hover:scale-105 transition-all border border-blue-50 dark:border-blue-900/40 shadow-sm" onClick={handlePracticeClick}>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl mb-4 group shadow-sm">
                            <Play className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest">Question Bank</span>
                    </button>
                    <button className="flex flex-col items-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl hover:scale-105 transition-all border border-emerald-50 dark:border-emerald-900/40 shadow-sm" onClick={handleMockExamClick}>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl mb-4 shadow-sm">
                            <Target className="h-6 w-6 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-widest">Mock Exams</span>
                    </button>
                    <button className="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-3xl hover:scale-105 transition-all border border-purple-50 dark:border-purple-900/40 shadow-sm" onClick={handleFlashcardsClick}>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl mb-4 shadow-sm">
                            <Brain className="h-6 w-6 text-purple-600" />
                        </div>
                        <span className="text-[10px] font-black text-purple-900 dark:text-purple-200 uppercase tracking-widest">Flashcards</span>
                    </button>
                    <button className="flex flex-col items-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl hover:scale-105 transition-all border border-orange-50 dark:border-orange-900/40 shadow-sm" onClick={handleAnalyticsClick}>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl mb-4 shadow-sm">
                            <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                        <span className="text-[10px] font-black text-orange-900 dark:text-orange-200 uppercase tracking-widest">Full Insights</span>
                    </button>
                </div>
            </div>

            {/* Bottom Row: Activity & Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-8">Digital Pulse</h3>
                    <div className="space-y-4">
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.slice(0, 5).map((activity, index) => (
                                <div key={index} className="flex items-center space-x-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                    <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white shadow-lg">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{activity.description}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                            {new Date(activity.timestamp).toLocaleDateString()} AT{' '}
                                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Waiting for initial activity...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deadlines */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Deadlines</h3>
                        <button
                            onClick={() => router.push('/homework')}
                            className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest flex items-center italic"
                        >
                            History <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {stats.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
                            stats.upcomingDeadlines.map((deadline) => (
                                <div key={deadline.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700/50 rounded-2xl border border-slate-50 dark:border-gray-600 group hover:border-blue-400 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-blue-600">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{deadline.title}</p>
                                            <p className="text-[8px] text-slate-400 font-bold">DUE {new Date(deadline.due_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`text-[9px] font-black px-3 py-1 rounded-lg italic uppercase shadow-sm ${deadline.days_left <= 1 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {deadline.days_left === 0 ? 'Urgent' : `${deadline.days_left}d`}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100">
                                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-4 opacity-50" />
                                <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase italic">All deadlines cleared</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
