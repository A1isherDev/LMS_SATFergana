'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Target, Brain, BookOpen } from 'lucide-react';
import { analyticsApi } from '../utils/api';

interface ActiveSession {
  id: number;
  session_type: string;
  started_at: string;
  current_duration_minutes: number;
}

interface StudySessionTrackerProps {
  onSessionUpdate?: () => void;
  className?: string;
}

export default function StudySessionTracker({ onSessionUpdate, className = '' }: StudySessionTrackerProps) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkActiveSession();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeSession) {
      interval = setInterval(() => {
        setCurrentDuration(prev => prev + 1);
      }, 60000); // Update every minute
    }
    
    return () => clearInterval(interval);
  }, [activeSession]);

  const checkActiveSession = async () => {
    try {
      const response = await analyticsApi.getActiveSession() as any;
      if (response.active_session) {
        setActiveSession(response.active_session);
        setCurrentDuration(response.active_session.current_duration_minutes);
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
    }
  };

  const startSession = async (sessionType: string) => {
    setIsLoading(true);
    try {
      const response = await analyticsApi.startStudySession(sessionType) as any;
      if (response) {
        setActiveSession(response);
        setCurrentDuration(0);
        onSessionUpdate?.();
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start study session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    
    setIsLoading(true);
    try {
      await analyticsApi.endStudySession(activeSession.id);
      setActiveSession(null);
      setCurrentDuration(0);
      
      // Call the callback to refresh dashboard data
      onSessionUpdate?.();
      
      // Show success message
      const message = `Great job! You studied for ${formatTime(currentDuration)}.`;
      if (typeof window !== 'undefined') {
        // Create a simple notification instead of alert
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      alert('Failed to end study session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getSessionIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'practice':
        return <Target className="h-4 w-4" />;
      case 'homework':
        return <BookOpen className="h-4 w-4" />;
      case 'mock_exam':
        return <Brain className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getSessionLabel = (sessionType: string) => {
    switch (sessionType) {
      case 'practice':
        return 'Practice Questions';
      case 'homework':
        return 'Homework';
      case 'mock_exam':
        return 'Mock Exam';
      default:
        return 'Study Session';
    }
  };

  if (!mounted) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className={className}>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">Active Session</span>
              {getSessionIcon(activeSession.session_type)}
              <span className="text-sm text-gray-700">{getSessionLabel(activeSession.session_type)}</span>
            </div>
            <div className="flex items-center space-x-2 text-green-700">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-sm font-medium">{formatTime(currentDuration)}</span>
            </div>
          </div>
          
          <button
            onClick={endSession}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Square className="h-4 w-4" />
            <span>{isLoading ? 'Ending...' : 'End Session'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Start Study Session</h3>
          <p className="text-xs text-gray-600">Track your study time and maintain your streak!</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => startSession('practice')}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Target className="h-4 w-4" />
            <span>{isLoading ? 'Starting...' : 'Practice'}</span>
          </button>
          
          <button
            onClick={() => startSession('homework')}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>{isLoading ? 'Starting...' : 'Homework'}</span>
          </button>
          
          <button
            onClick={() => startSession('mock_exam')}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Brain className="h-4 w-4" />
            <span>{isLoading ? 'Starting...' : 'Mock Exam'}</span>
          </button>
          
          <button
            onClick={() => startSession('general')}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Play className="h-4 w-4" />
            <span>{isLoading ? 'Starting...' : 'General'}</span>
          </button>
        </div>
        
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 Tip: Even 15 minutes counts toward your daily streak!
          </p>
        </div>
      </div>
    </div>
  );
}
