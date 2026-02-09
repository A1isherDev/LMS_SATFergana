'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Square, ChevronRight, ChevronLeft, Brain, Target, BookOpen } from 'lucide-react';
import { analyticsApi } from '../utils/api';
import { formatDuration } from '../utils/helpers';

interface StudySessionTrackerProps {
  onSessionUpdate?: () => void;
  className?: string;
}

export default function StudySessionTracker({ onSessionUpdate, className }: StudySessionTrackerProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<string>('REVIEW');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response: any = await analyticsApi.getActiveSession();
        if (response && response.session_id) {
          setSessionId(response.session_id);
          setSessionType(response.session_type);
          setTime(response.current_duration_minutes * 60);
          setIsActive(true);
        }
      } catch (error) {
        console.error('Error checking active session:', error);
      }
    };

    checkActiveSession();
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]);

  // Periodic sync with backend (every 5 minutes)
  useEffect(() => {
    const syncWithBackend = async () => {
      if (isActive && sessionId && time > 0 && time % 300 === 0) {
        try {
          await analyticsApi.updateActiveSession(sessionId, {
            duration_minutes: Math.floor(time / 60)
          });
        } catch (error) {
          console.error('Failed to sync study session:', error);
        }
      }
    };
    syncWithBackend();
  }, [isActive, sessionId, time]);

  const handleStart = async (type: string = 'REVIEW') => {
    setIsLoading(true);
    try {
      const response: any = await analyticsApi.startStudySession(type as any);
      setSessionId(response.id);
      setSessionType(type);
      setIsActive(true);
      setIsPaused(false);
      setTime(0);
    } catch (error) {
      console.error('Error starting study session:', error);
      alert('Failed to start study session');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = async () => {
    if (!confirm('Stop current study session?')) return;

    setIsLoading(true);
    try {
      if (sessionId) {
        await analyticsApi.endStudySession(sessionId);
      }
      setIsActive(false);
      setSessionId(null);
      setTime(0);

      // Trigger callback if provided
      if (onSessionUpdate) {
        onSessionUpdate();
      }

      // Notify parent or refresh if needed
      if (typeof window !== 'undefined') {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60]';
        notification.textContent = `Study session ended! You studied for ${Math.floor(time / 60)} minutes.`;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    } catch (error) {
      console.error('Error ending study session:', error);
      alert('Failed to end study session properly');
      setIsActive(false);
      setSessionId(null);
      setTime(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'HOMEWORK': return <BookOpen className="h-4 w-4" />;
      case 'MOCK_EXAM': return <Brain className="h-4 w-4" />;
      case 'QUESTION_PRACTICE': return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!isActive) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
        <div className="bg-white rounded-lg shadow-xl border border-blue-100 p-2 transform transition-all duration-300 hover:scale-105">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'QUESTION_PRACTICE', label: 'Practice', icon: Target, color: 'bg-blue-600' },
              { id: 'HOMEWORK', label: 'Homework', icon: BookOpen, color: 'bg-green-600' },
              { id: 'MOCK_EXAM', label: 'Mock Exam', icon: Brain, color: 'bg-purple-600' },
              { id: 'REVIEW', label: 'Review', icon: Clock, color: 'bg-gray-600' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleStart(btn.id)}
                disabled={isLoading}
                className={`${btn.color} text-white p-2 rounded flex flex-col items-center justify-center text-[10px] min-w-[60px] hover:opacity-90 transition-opacity`}
              >
                <btn.icon className="h-4 w-4 mb-1" />
                {btn.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm">
          Ready to Study?
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'}`}>
      <div className="bg-white rounded-lg shadow-2xl border border-blue-100 overflow-hidden">
        <div className="bg-blue-600 p-3 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1 rounded">
              {getSessionIcon(sessionType)}
            </div>
            {isExpanded && (
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Studying</span>
                <span className="text-xs font-semibold truncate max-w-[120px]">{sessionType.replace('_', ' ')}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 space-y-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold text-gray-800 tracking-tighter">
                {new Date(time * 1000).toISOString().substr(11, 8)}
              </span>
              <div className="h-1 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000"
                  style={{ width: `${(time % 60) / 60 * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={handlePause}
                className={`p-3 rounded-full ${isPaused ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'} hover:scale-110 transition-transform`}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <button
                onClick={handleStop}
                disabled={isLoading}
                className="p-3 bg-red-100 text-red-600 rounded-full hover:scale-110 transition-transform disabled:opacity-50"
                title="Stop & Save"
              >
                <Square className="h-5 w-5 fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
