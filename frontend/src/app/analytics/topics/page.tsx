'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../../components/AuthGuard';
import DashboardLayout from '../../../components/DashboardLayout';
import {
    Brain,
    Search,
    ArrowLeft,
    Filter,
    BarChart3,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { analyticsApi } from '../../../utils/api';
import { formatPercentage, getSubjectColor, getDifficultyColor } from '../../../utils/helpers';

interface TopicStat {
    skill_tag: string;
    question_type: string;
    total_attempts: number;
    correct_attempts: number;
    accuracy_rate: number;
    average_time_seconds: number;
}

export default function TopicBreakdownPage() {
    const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        const fetchTopicStats = async () => {
            try {
                setIsLoading(true);
                const response = await analyticsApi.getTopicAnalytics() as TopicStat[];
                setTopicStats(response);
            } catch (error) {
                console.error('Error fetching topic stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopicStats();
    }, []);

    const filteredStats = topicStats.filter(stat => {
        const matchesSearch = stat.skill_tag.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || stat.question_type === filterType;
        return matchesSearch && matchesType;
    });

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return 'text-green-600';
        if (accuracy >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getAccuracyBg = (accuracy: number) => {
        if (accuracy >= 80) return 'bg-green-100 text-green-800';
        if (accuracy >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    if (isLoading) {
        return (
            <AuthGuard>
                <DashboardLayout>
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-lg shadow p-6 h-48"></div>
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
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/analytics"
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6 text-gray-600" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Topic Performance</h1>
                                <p className="text-gray-600">Deep dive into your strengths and weaknesses by sub-topic</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search sub-topics..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Filter className="h-4 w-4 text-gray-400" />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Sections</option>
                                    <option value="MATH">Math</option>
                                    <option value="READING">Reading</option>
                                    <option value="WRITING">Writing</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-end">
                                <p className="text-sm text-gray-500">
                                    Showing {filteredStats.length} topics
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Topics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStats.map((stat, index) => (
                            <div key={index} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(stat.question_type)}`}>
                                            {stat.question_type}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${getAccuracyBg(stat.accuracy_rate)}`}>
                                            {formatPercentage(stat.accuracy_rate)} Accuracy
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{stat.skill_tag}</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <BarChart3 className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Attempts</p>
                                                <p className="text-sm font-bold text-gray-900">{stat.total_attempts}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-purple-50 rounded-lg">
                                                <Clock className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Avg Speed</p>
                                                <p className="text-sm font-bold text-gray-900">{Math.round(stat.average_time_seconds)}s/q</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${stat.accuracy_rate >= 80 ? 'bg-green-500' :
                                                    stat.accuracy_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${stat.accuracy_rate}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                            <span>{stat.correct_attempts} Correct</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <XCircle className="h-3 w-3 text-red-500" />
                                            <span>{stat.total_attempts - stat.correct_attempts} Incorrect</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredStats.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No topic data found</h3>
                            <p className="text-gray-500">Start practicing questions to see your performance breakdown</p>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
