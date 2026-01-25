'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, BookOpen, Eye, EyeOff } from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface Question {
  id: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TEXT' | 'MATH';
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  subject?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit?: number;
  points?: number;
}

interface QuestionCardProps {
  question: Question;
  onAnswer?: (answer: string) => void;
  onSkip?: () => void;
  showResult?: boolean;
  selectedAnswer?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeRemaining?: number;
  compact?: boolean;
  interactive?: boolean;
}

export default function QuestionCard({
  question,
  onAnswer,
  onSkip,
  showResult = false,
  selectedAnswer,
  userAnswer,
  isCorrect,
  timeRemaining,
  compact = false,
  interactive = true
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState(selectedAnswer || '');
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    if (!interactive) return;
    
    setLocalAnswer(answer);
    if (onAnswer) {
      onAnswer(answer);
    }
  };

  const handleSubmit = () => {
    if (localAnswer && onAnswer) {
      onAnswer(localAnswer);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectColor = (subject?: string) => {
    switch (subject) {
      case 'MATH':
        return 'bg-blue-100 text-blue-800';
      case 'READING':
        return 'bg-green-100 text-green-800';
      case 'WRITING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOptions = () => {
    if (question.questionType === 'MULTIPLE_CHOICE' && question.options) {
      return (
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = localAnswer === option.id;
            const isCorrect = option.isCorrect;
            const showCorrect = showResult && option.isCorrect;
            const showIncorrect = showResult && isSelected && !isCorrect;

            return (
              <label
                key={option.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  !interactive ? 'cursor-not-allowed' : 'hover:border-gray-300'
                } ${
                  isSelected && !showResult ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } ${
                  showCorrect ? 'border-green-500 bg-green-50' : ''
                } ${
                  showIncorrect ? 'border-red-500 bg-red-50' : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => handleAnswerSelect(option.id)}
                  disabled={!interactive}
                  className="mr-3"
                />
                <span className="flex-1">{option.text}</span>
                {showCorrect && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                )}
                {showIncorrect && (
                  <XCircle className="h-5 w-5 text-red-500 ml-2" />
                )}
              </label>
            );
          })}
        </div>
      );
    }

    if (question.questionType === 'TEXT') {
      return (
        <textarea
          value={localAnswer}
          onChange={(e) => setLocalAnswer(e.target.value)}
          disabled={!interactive}
          placeholder="Type your answer here..."
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
          rows={compact ? 3 : 4}
        />
      );
    }

    if (question.questionType === 'MATH') {
      return (
        <textarea
          value={localAnswer}
          onChange={(e) => setLocalAnswer(e.target.value)}
          disabled={!interactive}
          placeholder="Enter your mathematical answer..."
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 font-mono"
          rows={compact ? 2 : 3}
        />
      );
    }

    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow ${compact ? 'p-4' : 'p-6'}`}>
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {question.subject && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(question.subject)}`}>
              {question.subject}
            </span>
          )}
          {question.difficulty && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
          )}
          {question.points && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {question.points} pts
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {timeRemaining !== undefined && (
            <div className="flex items-center text-sm text-orange-600">
              <Clock className="h-4 w-4 mr-1" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}
          {showResult && question.explanation && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              {showExplanation ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </button>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'} mb-2`}>
          {compact ? (
            <span className="line-clamp-2">{question.questionText}</span>
          ) : (
            question.questionText
          )}
        </h3>
        {!compact && question.questionType === 'MULTIPLE_CHOICE' && (
          <p className="text-sm text-gray-500">Choose the best answer</p>
        )}
      </div>

      {/* Answer Options */}
      <div className="mb-6">
        {renderOptions()}
      </div>

      {/* Explanation */}
      {showResult && showExplanation && question.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
          <p className="text-blue-800">{question.explanation}</p>
        </div>
      )}

      {/* Result Feedback */}
      {showResult && userAnswer && (
        <div className={`rounded-lg p-4 mb-6 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          {!isCorrect && question.correctAnswer && (
            <p className="text-sm mt-2 text-red-700">
              Correct answer: {question.correctAnswer}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {interactive && !showResult && (
        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
            Question {question.id}
          </div>
          <div className="flex space-x-3">
            {onSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!localAnswer}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
