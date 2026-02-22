'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Filter } from 'lucide-react';
import { classesApi } from '../utils/api';

interface LeaderboardEntry {
    student_id: number;
    student_name: string;
    student_email: string;
    total_points: number;
    homework_completion_rate: number;
    homework_accuracy: number;
    average_mock_score: number;
    rank: number;
}

interface LeaderboardTableProps {
    classId: number;
}

export default function LeaderboardTable({ classId }: LeaderboardTableProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [period, setPeriod] = useState('all_time');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [classId, period]);

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const data: any = await classesApi.getClassLeaderboard(classId, period);
            setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : data ? [data] : []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setLeaderboard([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Award className="h-5 w-5 text-orange-500" />;
            default:
                return <span className="font-bold text-gray-400">#{rank}</span>;
        }
    };

    return (
        <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                    <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                    <h2 className="text-xl font-bold text-foreground">Class Leaderboard</h2>
                </div>

                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="text-sm border-border bg-card text-foreground rounded-md focus:ring-blue-500 focus:border-blue-500 p-1"
                    >
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                        <option value="all_time">All Time</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Completion</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SAT Avg</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {isLoading ? (
                            [1, 2, 3].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                </tr>
                            ))
                        ) : leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                    No data available for this period.
                                </td>
                            </tr>
                        ) : (
                            leaderboard.map((entry) => (
                                <tr key={entry.student_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-center">
                                            {getRankIcon(entry.rank)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                                                {entry.student_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{entry.student_name}</div>
                                                <div className="text-xs text-gray-500">{entry.student_email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-blue-600 font-bold">
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                            {entry.total_points}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{entry.homework_completion_rate}%</div>
                                        <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                                            <div
                                                className="bg-green-500 h-1 rounded-full"
                                                style={{ width: `${entry.homework_completion_rate}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{entry.homework_accuracy}%</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Award className="h-4 w-4 text-purple-500 mr-1" />
                                            <span className="text-sm font-bold text-gray-900">{entry.average_mock_score || 'N/A'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && leaderboard.length > 0 && (
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                    <p className="text-xs text-center text-gray-500">
                        Points are calculated based on homework completion, accuracy, and SAT mock exam scores.
                    </p>
                </div>
            )}
        </div>
    );
}
