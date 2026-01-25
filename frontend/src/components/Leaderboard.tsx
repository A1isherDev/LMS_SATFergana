'use client';

import React from 'react';
import { Trophy, Medal, Crown, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  student: {
    first_name: string;
    last_name: string;
    email: string;
  };
  points: number;
  trend: 'up' | 'down' | 'stable';
  previous_rank?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showTrend?: boolean;
  maxEntries?: number;
  compact?: boolean;
}

export default function Leaderboard({ 
  entries, 
  title = 'Leaderboard', 
  showTrend = true,
  maxEntries = 10,
  compact = false 
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
          {rank}
        </div>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500 text-xs">↑</span>;
      case 'down':
        return <span className="text-red-500 text-xs">↓</span>;
      default:
        return <span className="text-gray-500 text-xs">—</span>;
    }
  };

  const displayEntries = entries.slice(0, maxEntries);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            {title}
          </h3>
          <span className="text-sm text-gray-500">
            {displayEntries.length} participants
          </span>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-200">
        {displayEntries.map((entry) => (
          <div
            key={`${entry.student.email}-${entry.rank}`}
            className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
              entry.isCurrentUser ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Student Info */}
                <div className={compact ? 'flex-1' : ''}>
                  <div className="flex items-center space-x-2">
                    <p className={`font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>
                      {entry.student.first_name} {entry.student.last_name}
                    </p>
                    {entry.isCurrentUser && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  {!compact && (
                    <p className="text-sm text-gray-500">{entry.student.email}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4">
                {showTrend && entry.previous_rank && (
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(entry.trend)}
                      <span className="text-xs text-gray-500">
                        {entry.trend === 'stable' ? '—' :
                         entry.trend === 'up' ? `+${entry.previous_rank - entry.rank}` :
                         `-${entry.rank - entry.previous_rank}`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-right">
                  <p className={`font-bold text-gray-900 ${compact ? 'text-sm' : ''}`}>
                    {entry.points}
                  </p>
                  <p className={`text-xs text-gray-500 ${compact ? 'hidden' : ''}`}>points</p>
                </div>

                {/* Rank Badge */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                  entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                  entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  #{entry.rank}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {entries.length > maxEntries && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            Showing {maxEntries} of {entries.length} entries
          </p>
        </div>
      )}
    </div>
  );
}
