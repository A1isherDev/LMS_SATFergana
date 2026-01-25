'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Pause, Play, Square, SkipForward, CheckCircle, AlertCircle } from 'lucide-react';

interface Section {
  name: string;
  totalQuestions: number;
  timeLimit: number; // in minutes
  order: number;
}

interface Question {
  id: number;
  section: string;
  questionText: string;
  options?: string[];
  timeSpent?: number;
  answered?: boolean;
  markedForReview?: boolean;
}

interface MockExamSectionProps {
  sections: Section[];
  questions: Question[];
  currentSection: number;
  currentQuestion: number;
  timeRemaining: number;
  onSectionChange?: (sectionIndex: number) => void;
  onQuestionChange?: (questionIndex: number) => void;
  onPause?: () => void;
  onSubmit?: () => void;
  onTimeUp?: () => void;
  isPaused?: boolean;
  isSubmitted?: boolean;
  compact?: boolean;
  showNavigation?: boolean;
}

export default function MockExamSection({
  sections,
  questions,
  currentSection,
  currentQuestion,
  timeRemaining,
  onSectionChange,
  onQuestionChange,
  onPause,
  onSubmit,
  onTimeUp,
  isPaused = false,
  isSubmitted = false,
  compact = false,
  showNavigation = true
}: MockExamSectionProps) {
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  useEffect(() => {
    setLocalTimeRemaining(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (localTimeRemaining <= 0 && !isSubmitted && onTimeUp) {
      onTimeUp();
    }
  }, [localTimeRemaining, isSubmitted, onTimeUp]);

  useEffect(() => {
    if (!isPaused && !isSubmitted && localTimeRemaining > 0) {
      const timer = setInterval(() => {
        setLocalTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPaused, isSubmitted, localTimeRemaining]);

  // Auto-submit when time is up
  useEffect(() => {
    if (localTimeRemaining <= 0 && !isSubmitted && onSubmit) {
      onSubmit();
    }
  }, [isPaused, isSubmitted, localTimeRemaining, onSubmit]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (localTimeRemaining / (sections[currentSection]?.timeLimit * 60 || 1)) * 100;
    if (percentage <= 10) return 'text-red-600';
    if (percentage <= 25) return 'text-orange-600';
    return 'text-green-600';
  };

  const getSectionProgress = (sectionIndex: number) => {
    const sectionQuestions = questions.filter(q => q.section === sections[sectionIndex]?.name);
    const answeredQuestions = sectionQuestions.filter(q => q.answered).length;
    return {
      answered: answeredQuestions,
      total: sectionQuestions.length,
      percentage: sectionQuestions.length > 0 ? (answeredQuestions / sectionQuestions.length) * 100 : 0
    };
  };

  const getOverallProgress = () => {
    const totalAnswered = questions.filter(q => q.answered).length;
    return {
      answered: totalAnswered,
      total: questions.length,
      percentage: (totalAnswered / questions.length) * 100
    };
  };

  const currentSectionData = sections[currentSection];
  const sectionProgress = getSectionProgress(currentSection);
  const overallProgress = getOverallProgress();

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">Exam Submitted</h3>
            <p className="text-green-700">Your answers have been successfully submitted.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              {currentSectionData?.name}
            </h3>
            {!compact && (
              <p className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {sectionProgress.total}
              </p>
            )}
          </div>
          
          {isPaused && (
            <div className="flex items-center text-orange-600">
              <Pause className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Paused</span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${getTimeColor()}`}>
            <Clock className="h-5 w-5 mr-2" />
            <span className={`font-mono font-bold ${compact ? 'text-lg' : 'text-xl'}`}>
              {formatTime(localTimeRemaining)}
            </span>
          </div>
          
          {/* Control Buttons */}
          <div className="flex space-x-2">
            {onPause && !isPaused && (
              <button
                onClick={onPause}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Pause Exam"
              >
                <Pause className="h-4 w-4" />
              </button>
            )}
            {onSubmit && (
              <button
                onClick={onSubmit}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="h-4 w-4 mr-2" />
                Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      {!compact && (
        <div className="space-y-3 mb-6">
          {/* Section Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Section Progress</span>
              <span className="font-medium text-gray-900">
                {sectionProgress.answered}/{sectionProgress.total} ({Math.round(sectionProgress.percentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${sectionProgress.percentage}%` }}
              />
            </div>
          </div>

          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium text-gray-900">
                {overallProgress.answered}/{overallProgress.total} ({Math.round(overallProgress.percentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {showNavigation && sections.length > 1 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sections:</span>
              {sections.map((section, index) => {
                const progress = getSectionProgress(index);
                const isActive = index === currentSection;
                const isCompleted = progress.percentage === 100;
                
                return (
                  <button
                    key={index}
                    onClick={() => onSectionChange && onSectionChange(index)}
                    disabled={!onSectionChange}
                    className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50'
                        : isCompleted
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!onSectionChange ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{section.name}</span>
                      {isCompleted && (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {progress.answered}/{progress.total}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Question Navigation */}
            {onQuestionChange && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onQuestionChange(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                <span className="text-sm text-gray-600">
                  {currentQuestion + 1} / {sectionProgress.total}
                </span>
                <button
                  onClick={() => onQuestionChange(Math.min(sectionProgress.total - 1, currentQuestion + 1))}
                  disabled={currentQuestion === sectionProgress.total - 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Warning */}
      {localTimeRemaining <= 300 && localTimeRemaining > 0 && (
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
            <span className="text-sm text-orange-800">
              Less than 5 minutes remaining in this section!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
