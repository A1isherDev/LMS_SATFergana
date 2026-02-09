'use client';

import { useEffect, useState } from 'react';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { usersApi } from '../utils/api';

interface StreakData {
    streak_count: number;
    streak_display: string;
    last_active_date: string | null;
}

export default function StreakBadge() {
    const [streak, setStreak] = useState<StreakData>({
        streak_count: 0,
        streak_display: '0 days',
        last_active_date: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        const fetchAndUpdateStreak = async () => {
            try {
                // First, update the streak
                const updateResponse = await usersApi.updateStreak();
                setStreak(updateResponse as StreakData);

                // Check for milestone achievements
                const milestones = [7, 30, 50, 100, 365];
                const response = updateResponse as StreakData;
                if (milestones.includes(response.streak_count)) {
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 5000);
                }
            } catch (error) {
                console.error('Error updating streak:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndUpdateStreak();
    }, []);

    const getStreakColor = () => {
        if (streak.streak_count === 0) return 'text-gray-400';
        if (streak.streak_count < 7) return 'text-orange-500';
        if (streak.streak_count < 30) return 'text-orange-600';
        if (streak.streak_count < 100) return 'text-red-500';
        return 'text-purple-600';
    };

    const getStreakMessage = () => {
        if (streak.streak_count === 0) return 'Start your streak today!';
        if (streak.streak_count < 7) return 'Keep it up!';
        if (streak.streak_count < 30) return 'Great consistency!';
        if (streak.streak_count < 100) return 'Amazing dedication!';
        return 'Legendary streak!';
    };

    const getMilestoneProgress = () => {
        const milestones = [7, 30, 50, 100, 365];
        const nextMilestone = milestones.find(m => m > streak.streak_count) || 365;
        return {
            next: nextMilestone,
            progress: (streak.streak_count / nextMilestone) * 100
        };
    };

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
                <div className="h-5 w-5 bg-gray-300 rounded"></div>
                <div className="h-4 w-16 bg-gray-300 rounded"></div>
            </div>
        );
    }

    const milestone = getMilestoneProgress();

    return (
        <>
            {/* Celebration Modal */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
                    <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center transform animate-bounce-in">
                        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            🎉 Milestone Achieved! 🎉
                        </h2>
                        <p className="text-lg text-gray-700 mb-4">
                            {streak.streak_count} Day Streak!
                        </p>
                        <p className="text-gray-600">
                            You&apos;re on fire! Keep up the amazing work!
                        </p>
                    </div>
                </div>
            )}

            {/* Streak Badge */}
            <div className="relative group">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 hover:shadow-md transition-all cursor-pointer">
                    <Flame className={`h-5 w-5 ${getStreakColor()} ${streak.streak_count > 0 ? 'animate-pulse' : ''}`} />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                            {streak.streak_count}
                        </span>
                        <span className="text-xs text-gray-500">day streak</span>
                    </div>
                </div>

                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Your Streak</h3>
                        <Flame className={`h-5 w-5 ${getStreakColor()}`} />
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{getStreakMessage()}</p>

                    {streak.streak_count > 0 && (
                        <>
                            <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Next milestone: {milestone.next} days</span>
                                    <span>{Math.round(milestone.progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(milestone.progress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center text-xs text-gray-500 mt-3">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Last active: {streak.last_active_date ? new Date(streak.last_active_date).toLocaleDateString() : 'Today'}</span>
                            </div>
                        </>
                    )}

                    {streak.streak_count === 0 && (
                        <div className="text-xs text-gray-500 mt-2">
                            <p>Come back tomorrow to start building your streak!</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
