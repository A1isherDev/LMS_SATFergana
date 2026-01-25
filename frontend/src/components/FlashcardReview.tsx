'use client';

import React, { useState } from 'react';
import { RotateCcw, CheckCircle, XCircle, SkipForward, Volume2 } from 'lucide-react';

interface FlashcardData {
  id: number;
  word: string;
  definition: string;
  pronunciation?: string;
  exampleSentence: string;
  subject?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
}

interface FlashcardReviewProps {
  flashcard: FlashcardData;
  onCorrect?: () => void;
  onIncorrect?: () => void;
  onSkip?: () => void;
  showResult?: boolean;
  userAnswer?: 'correct' | 'incorrect' | 'skipped';
  isFlipped?: boolean;
  onFlip?: () => void;
  compact?: boolean;
  interactive?: boolean;
  showProgress?: boolean;
  currentIndex?: number;
  totalCards?: number;
}

export default function FlashcardReview({
  flashcard,
  onCorrect,
  onIncorrect,
  onSkip,
  showResult = false,
  userAnswer,
  isFlipped = false,
  onFlip,
  compact = false,
  interactive = true,
  showProgress = true,
  currentIndex = 0,
  totalCards = 1
}: FlashcardReviewProps) {
  const [localFlipped, setLocalFlipped] = useState(isFlipped);
  const [showPronunciation, setShowPronunciation] = useState(false);

  const handleFlip = () => {
    if (!interactive) return;
    setLocalFlipped(!localFlipped);
    if (onFlip) {
      onFlip();
    }
  };

  const handleCorrect = () => {
    if (onCorrect) onCorrect();
  };

  const handleIncorrect = () => {
    if (onIncorrect) onIncorrect();
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
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

  const getResultIcon = () => {
    switch (userAnswer) {
      case 'correct':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'incorrect':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getResultColor = () => {
    switch (userAnswer) {
      case 'correct':
        return 'border-green-500 bg-green-50';
      case 'incorrect':
        return 'border-red-500 bg-red-50';
      case 'skipped':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow ${compact ? 'p-4' : 'p-6'} ${showResult ? getResultColor() : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {flashcard.subject && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(flashcard.subject)}`}>
              {flashcard.subject}
            </span>
          )}
          {flashcard.difficulty && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(flashcard.difficulty)}`}>
              {flashcard.difficulty}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showProgress && (
            <span className="text-sm text-gray-500">
              {currentIndex + 1}/{totalCards}
            </span>
          )}
          {showResult && getResultIcon()}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && totalCards > 1 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Flashcard Content */}
      <div className={`${compact ? 'min-h-[200px]' : 'min-h-[300px]'} flex flex-col items-center justify-center`}>
        {!localFlipped ? (
          // Front of card - Word
          <div className="text-center">
            <h2 className={`font-bold text-gray-900 mb-4 ${compact ? 'text-2xl' : 'text-3xl'}`}>
              {flashcard.word}
            </h2>
            
            {flashcard.pronunciation && (
              <div className="flex items-center justify-center mb-4 space-x-2">
                <span className="text-gray-600">{flashcard.pronunciation}</span>
                <button
                  onClick={() => setShowPronunciation(!showPronunciation)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Play pronunciation"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {interactive && (
              <button
                onClick={handleFlip}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Flip Card
              </button>
            )}
          </div>
        ) : (
          // Back of card - Definition
          <div className="text-center w-full">
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Definition</h3>
              <p className="text-gray-700 mb-4">{flashcard.definition}</p>
              
              {flashcard.exampleSentence && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Example</h4>
                  <p className="text-gray-600 italic">"{flashcard.exampleSentence}"</p>
                </div>
              )}
            </div>

            {interactive && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleIncorrect}
                  className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Incorrect
                </button>
                <button
                  onClick={handleSkip}
                  className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </button>
                <button
                  onClick={handleCorrect}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Correct
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      {flashcard.tags && flashcard.tags.length > 0 && !compact && (
        <div className="mt-4 flex flex-wrap gap-1">
          {flashcard.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Result Message */}
      {showResult && userAnswer && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          userAnswer === 'correct' ? 'bg-green-100 text-green-800' :
          userAnswer === 'incorrect' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          <div className="flex items-center">
            {getResultIcon()}
            <span className="ml-2 font-medium">
              {userAnswer === 'correct' ? 'Marked as correct' :
               userAnswer === 'incorrect' ? 'Marked as incorrect - will review again soon' :
               'Skipped - will see again later'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
