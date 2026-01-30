'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Brain, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  BookOpen,
  Filter,
  Search,
  Play,
  SkipForward,
  Star,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, getSubjectColor } from '../../utils/helpers';
import { flashcardsApi } from '../../utils/api';

interface Flashcard {
  id: number;
  word: string;
  definition: string;
  pronunciation?: string;
  example_sentence: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subject: 'MATH' | 'READING' | 'WRITING';
  created_at: string;
}

interface FlashcardProgress {
  id: number;
  flashcard: number;
  easiness_factor: number;
  repetition_count: number;
  interval_days: number;
  next_review_date: string;
  last_reviewed_at?: string;
  is_mastered: boolean;
  created_at: string;
  updated_at: string;
}

interface ReviewSession {
  id: number;
  started_at: string;
  cards_reviewed: number;
  correct_answers: number;
  current_card: Flashcard;
  show_definition: boolean;
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<FlashcardProgress[]>([]);
  const [currentSession, setCurrentSession] = useState<ReviewSession | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch actual flashcards and progress from API
    const mockFlashcards: Flashcard[] = [
      {
        id: 1,
        word: 'Ubiquitous',
        definition: 'Present, appearing, or found everywhere',
        pronunciation: 'yoo-BIK-wi-tuhs',
        example_sentence: 'Smartphones have become ubiquitous in modern society.',
        difficulty: 'MEDIUM',
        subject: 'READING',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        word: 'Quadratic',
        definition: 'Involving the second and no higher power of an unknown quantity or variable',
        pronunciation: 'kwo-DRAT-ik',
        example_sentence: 'The quadratic equation x² + 5x + 6 = 0 has two solutions.',
        difficulty: 'HARD',
        subject: 'MATH',
        created_at: '2024-01-16T14:30:00Z'
      },
      {
        id: 3,
        word: 'Concise',
        definition: 'Giving a lot of information clearly and in a few words; brief but comprehensive',
        pronunciation: 'kun-SISE',
        example_sentence: 'The professor gave a concise explanation of the complex theory.',
        difficulty: 'EASY',
        subject: 'WRITING',
        created_at: '2024-01-17T09:15:00Z'
      }
    ];

    const mockProgress: FlashcardProgress[] = [
      {
        id: 1,
        flashcard: 1,
        easiness_factor: 2.5,
        repetition_count: 3,
        interval_days: 7,
        next_review_date: '2024-01-31T10:00:00Z',
        last_reviewed_at: '2024-01-24T10:00:00Z',
        is_mastered: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-24T10:00:00Z'
      },
      {
        id: 2,
        flashcard: 2,
        easiness_factor: 1.3,
        repetition_count: 1,
        interval_days: 1,
        next_review_date: '2024-01-25T14:30:00Z',
        last_reviewed_at: '2024-01-24T14:30:00Z',
        is_mastered: false,
        created_at: '2024-01-16T14:30:00Z',
        updated_at: '2024-01-24T14:30:00Z'
      }
    ];

    setTimeout(() => {
      setFlashcards(mockFlashcards);
      setProgress(mockProgress);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
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

  const getStatusColor = (flashcardId: number) => {
    const cardProgress = progress.find(p => p.flashcard === flashcardId);
    if (!cardProgress) return 'bg-gray-100 text-gray-800';
    if (cardProgress.is_mastered) return 'bg-purple-100 text-purple-800';
    
    const now = new Date();
    const nextReview = new Date(cardProgress.next_review_date);
    if (now >= nextReview) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (flashcardId: number) => {
    const cardProgress = progress.find(p => p.flashcard === flashcardId);
    if (!cardProgress) return 'New';
    if (cardProgress.is_mastered) return 'Mastered';
    
    const now = new Date();
    const nextReview = new Date(cardProgress.next_review_date);
    if (now >= nextReview) return 'Due for Review';
    return 'In Progress';
  };

  const filteredFlashcards = flashcards.filter(card => {
    const matchesSearch = card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.example_sentence.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = filterSubject === 'all' || card.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || card.difficulty === filterDifficulty;
    
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const status = getStatusText(card.id);
      switch (filterStatus) {
        case 'new':
          matchesStatus = status === 'New';
          break;
        case 'mastered':
          matchesStatus = status === 'Mastered';
          break;
        case 'due':
          matchesStatus = status === 'Due for Review';
          break;
        case 'progress':
          matchesStatus = status === 'In Progress';
          break;
      }
    }
    
    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  const startReview = () => {
    const availableCards = filteredFlashcards.filter(card => {
      const status = getStatusText(card.id);
      return status === 'Due for Review' || status === 'New';
    });

    if (availableCards.length > 0) {
      const firstCard = availableCards[0];
      const session: ReviewSession = {
        id: Date.now(),
        started_at: new Date().toISOString(),
        cards_reviewed: 0,
        correct_answers: 0,
        current_card: firstCard,
        show_definition: false
      };
      setCurrentSession(session);
      setIsReviewMode(true);
    }
  };

  const flipCard = () => {
    setCurrentSession(prev => prev ? { ...prev, show_definition: !prev.show_definition } : null);
  };

  const markCorrect = () => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      cards_reviewed: prev.cards_reviewed + 1,
      correct_answers: prev.correct_answers + 1
    } : null);

    // Move to next card
    moveToNextCard();
  };

  const markIncorrect = () => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      cards_reviewed: prev.cards_reviewed + 1
    } : null);

    // Move to next card
    moveToNextCard();
  };

  const moveToNextCard = () => {
    const availableCards = filteredFlashcards.filter(card => {
      const status = getStatusText(card.id);
      return status === 'Due for Review' || status === 'New';
    });

    const currentIndex = availableCards.findIndex(card => card.id === currentSession?.current_card.id);
    const nextIndex = (currentIndex + 1) % availableCards.length;
            
    if (nextIndex === 0 && currentSession?.cards_reviewed || 0 > 0) {
      // End of review session
      setIsReviewMode(false);
      setCurrentSession(null);
    } else {
      const nextCard = availableCards[nextIndex];
      setCurrentSession(prev => prev ? {
        ...prev,
        current_card: nextCard,
        show_definition: false
      } : null);
    }
  };

  const skipCard = () => {
    moveToNextCard();
  };

  const endReview = () => {
    setIsReviewMode(false);
    setCurrentSession(null);
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (isReviewMode && currentSession) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            {/* Review Header */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Flashcard Review</h1>
                <button
                  onClick={endReview}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  End Review
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{currentSession.cards_reviewed}</p>
                  <p className="text-sm text-gray-500">Cards Reviewed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {currentSession.cards_reviewed > 0 
                      ? Math.round((currentSession.correct_answers / currentSession.cards_reviewed) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{currentSession.correct_answers}</p>
                  <p className="text-sm text-gray-500">Correct</p>
                </div>
              </div>
            </div>

            {/* Flashcard */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-8">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(currentSession.current_card.subject)}`}>
                      {currentSession.current_card.subject}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(currentSession.current_card.difficulty)}`}>
                      {currentSession.current_card.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Brain className="h-4 w-4" />
                    <span>{getStatusText(currentSession.current_card.id)}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="min-h-[300px] flex flex-col items-center justify-center">
                  {!currentSession.show_definition ? (
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        {currentSession.current_card.word}
                      </h2>
                      {currentSession.current_card.pronunciation && (
                        <p className="text-lg text-gray-600 mb-4">
                          {currentSession.current_card.pronunciation}
                        </p>
                      )}
                      <button
                        onClick={flipCard}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <RotateCcw className="h-4 w-4 mr-2 inline" />
                        Flip Card
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Definition</h3>
                        <p className="text-gray-700 mb-4">{currentSession.current_card.definition}</p>
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Example</h4>
                          <p className="text-gray-600 italic">"{currentSession.current_card.example_sentence}"</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={markIncorrect}
                          className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Incorrect
                        </button>
                        <button
                          onClick={skipCard}
                          className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <SkipForward className="h-4 w-4 mr-2" />
                          Skip
                        </button>
                        <button
                          onClick={markCorrect}
                          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Correct
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
              <p className="text-gray-600">Master SAT vocabulary with spaced repetition</p>
            </div>
            <button
              onClick={startReview}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Review
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cards</p>
                  <p className="text-2xl font-bold text-gray-900">{flashcards.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mastered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progress.filter(p => p.is_mastered).length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Today</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {flashcards.filter(card => getStatusText(card.id) === 'Due for Review').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Cards</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {flashcards.filter(card => getStatusText(card.id) === 'New').length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search flashcards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                <option value="MATH">Math</option>
                <option value="READING">Reading</option>
                <option value="WRITING">Writing</option>
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="due">Due for Review</option>
                <option value="progress">In Progress</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
          </div>

          {/* Flashcards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlashcards.map((card) => {
              const cardProgress = progress.find(p => p.flashcard === card.id);
              return (
                <div key={card.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(card.subject)}`}>
                          {card.subject}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(card.difficulty)}`}>
                          {card.difficulty}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(card.id)}`}>
                        {getStatusText(card.id)}
                      </span>
                    </div>

                    {/* Card Content */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.word}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{card.definition}</p>
                    <p className="text-gray-500 text-xs italic mb-4 line-clamp-2">"{card.example_sentence}"</p>

                    {/* Progress Info */}
                    {cardProgress && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Reviewed {cardProgress.repetition_count} times</span>
                          <span>Next: {formatDate(cardProgress.next_review_date)}</span>
                        </div>
                        {cardProgress.is_mastered && (
                          <div className="flex items-center mt-2 text-purple-600">
                            <Star className="h-3 w-3 mr-1" />
                            <span className="text-xs font-medium">Mastered</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <button
                      onClick={() => {
                        setCurrentSession({
                          id: Date.now(),
                          started_at: new Date().toISOString(),
                          cards_reviewed: 0,
                          correct_answers: 0,
                          current_card: card,
                          show_definition: false
                        });
                        setIsReviewMode(true);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Study Card
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredFlashcards.length === 0 && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards found</h3>
              <p className="text-gray-500">
                {searchTerm || filterSubject !== 'all' || filterDifficulty !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start by adding some flashcards to your collection'}
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
