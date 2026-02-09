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
    ClipboardList
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
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ExamCountdown
                    examDate={studentProfile?.sat_exam_date || null}
                    className="bg-card rounded-lg shadow p-6"
                />

                <StudyStreak
                    streakDays={stats.studyStreak}
                    studyTimeToday={stats.studyTimeToday}
                    className="col-span-1"
                />

                <div className="bg-card rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                            <p className={`text-2xl font-bold ${getSatScoreColor(stats.averageScore)}`}>
                                {stats.averageScore}
                            </p>
                            <p className="text-xs text-muted-foreground">Target: 1400+</p>
                        </div>
                        <Target className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Today&apos;s Study</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatDuration(stats.studyTimeToday)}
                            </p>
                            <p className="text-xs text-muted-foreground">Goal: 2 hours</p>
                        </div>
                        <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-card rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Digital SAT Progress</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground opacity-80">Attempts</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {stats.digitalSatAttempts || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Total practice tests</p>
                            </div>
                            <Target className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Average Score</p>
                                <p className={`text-2xl font-bold ${getSatScoreColor(stats.digitalSatAverageScore || 0)}`}>
                                    {stats.digitalSatAverageScore || 0}
                                </p>
                                <p className="text-xs text-gray-500">Out of 1600</p>
                            </div>
                            <Award className="h-8 w-8 text-gray-400" />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Best Score</p>
                                <p className={`text-2xl font-bold ${getSatScoreColor(stats.digitalSatBestScore || 0)}`}>
                                    {stats.digitalSatBestScore || 0}
                                </p>
                                <p className="text-xs text-gray-500">Personal best</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-gray-400" />
                        </div>

                        <button
                            onClick={() => router.push('/mockexams/bluebook')}
                            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Practice Digital SAT
                        </button>
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Homework Progress</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-foreground opacity-80">Completion Rate</span>
                                <span className="text-sm text-muted-foreground">{formatPercentage(stats.homeworkCompletion)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${stats.homeworkCompletion}%` }}
                                ></div>
                            </div>
                        </div>

                        {stats.nextAssignment ? (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Next Up</p>
                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2 truncate">{stats.nextAssignment.title}</h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-blue-700 dark:text-blue-400">Due in {stats.nextAssignment.days_left} days</span>
                                    <button
                                        onClick={() => router.push(`/homework`)}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                                    >
                                        Start <ChevronRight className="h-3 w-3 ml-1" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-muted-foreground">All caught up!</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Areas to Improve</h3>
                    <div className="space-y-3">
                        {stats.weakAreas.map((area, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">{area}</span>
                                </div>
                                <button
                                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                                    onClick={() => handleWeakAreaPractice(area)}
                                >
                                    Practice
                                </button>
                            </div>
                        ))}
                        {stats.weakAreas.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No weak areas identified. Keep up the great work!</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Secondary Row: Upcoming Deadlines & Progress Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Deadlines */}
                <div className="bg-card rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <ClipboardList className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-foreground">Upcoming Deadlines</h3>
                        </div>
                        <button
                            onClick={() => router.push('/homework')}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-4">
                        {stats.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
                            stats.upcomingDeadlines.map((deadline) => (
                                <div key={deadline.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors border border-border">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{deadline.title}</p>
                                            <p className="text-xs text-muted-foreground">Due {new Date(deadline.due_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${deadline.days_left <= 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {deadline.days_left === 0 ? 'Due Today' : `${deadline.days_left}d left`}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2 opacity-20" />
                                <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Score Trends */}
                <ProgressChart
                    title="Score Progress"
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

            {/* Recent Activity */}
            <div className="bg-card rounded-lg shadow p-6 text-foreground">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {stats.recentActivity.length > 0 ? (
                        stats.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
                            <p className="text-sm text-muted-foreground italic">No recent activity recorded. Start studying to see your feed!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Study Session Tracker */}
            <StudySessionTracker
                onSessionUpdate={handleSessionUpdate}
                className="col-span-1"
            />

            {/* Quick Actions */}
            <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-100 dark:border-blue-900/30 transition-all" onClick={handlePracticeClick}>
                        <Play className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Start Practice</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-100 dark:border-green-900/30 transition-all" onClick={handleMockExamClick}>
                        <Target className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-200">Take Mock Exam</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-100 dark:border-purple-900/30 transition-all" onClick={handleFlashcardsClick}>
                        <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-200">Review Flashcards</span>
                    </button>
                    <button className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-100 dark:border-orange-900/30 transition-all" onClick={handleAnalyticsClick}>
                        <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
                        <span className="text-sm font-medium text-orange-900 dark:text-orange-200">View Analytics</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
