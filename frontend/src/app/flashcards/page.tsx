'use client';

import { useState, useEffect, useRef } from 'react';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BookOpen,
  Search,
  Play,
  Star,
  ArrowLeft,
  TrendingUp,
  Repeat
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
  mastered_count: number;
  still_learning_count: number;
  remaining_cards: Flashcard[];
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

  // Swipe functionality
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await flashcardsApi.getFlashcards();
      // const progressResponse = await flashcardsApi.getProgress();
      
      // Mock data for now
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
        },
        {
          id: 4,
          word: 'Ephemeral',
          definition: 'Lasting for a very short time',
          pronunciation: 'ih-FEM-er-uhl',
          example_sentence: 'The beauty of cherry blossoms is ephemeral, lasting only a few days.',
          difficulty: 'MEDIUM',
          subject: 'READING',
          created_at: '2024-01-18T11:20:00Z'
        },
        {
          id: 5,
          word: 'Hypothesis',
          definition: 'A supposition or proposed explanation made on the basis of limited evidence',
          pronunciation: 'hy-POTH-uh-sis',
          example_sentence: 'The scientist proposed a hypothesis to explain the unusual results.',
          difficulty: 'MEDIUM',
          subject: 'WRITING',
          created_at: '2024-01-19T15:45:00Z'
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

      setFlashcards(mockFlashcards);
      setProgress(mockProgress);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCardProgress = async (flashcardId: number, isMastered: boolean) => {
    try {
      // TODO: Replace with actual API call
      // await flashcardsApi.updateProgress(flashcardId, { is_mastered: isMastered });
      
      // Update local state
      setProgress(prev => {
        const existing = prev.find(p => p.flashcard === flashcardId);
        if (existing) {
          return prev.map(p => 
            p.flashcard === flashcardId 
              ? { 
                  ...p, 
                  is_mastered: isMastered,
                  repetition_count: p.repetition_count + 1,
                  last_reviewed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              : p
          );
        } else {
          return [...prev, {
            id: Date.now(),
            flashcard: flashcardId,
            easiness_factor: 2.5,
            repetition_count: 1,
            interval_days: isMastered ? 7 : 1,
            next_review_date: new Date(Date.now() + (isMastered ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString(),
            last_reviewed_at: new Date().toISOString(),
            is_mastered: isMastered,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }
      });
    } catch (error) {
      console.error('Error updating card progress:', error);
    }
  };

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
    if (cardProgress.is_mastered) return 'bg-green-100 text-green-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getStatusText = (flashcardId: number) => {
    const cardProgress = progress.find(p => p.flashcard === flashcardId);
    if (!cardProgress) return 'New';
    if (cardProgress.is_mastered) return 'Mastered';
    return 'Still Learning';
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
        case 'learning':
          matchesStatus = status === 'Still Learning';
          break;
      }
    }
    
    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  const startReview = () => {
    const availableCards = filteredFlashcards.filter(card => {
      const status = getStatusText(card.id);
      return status === 'Still Learning' || status === 'New';
    });

    if (availableCards.length > 0) {
      const firstCard = availableCards[0];
      const session: ReviewSession = {
        id: Date.now(),
        started_at: new Date().toISOString(),
        cards_reviewed: 0,
        mastered_count: 0,
        still_learning_count: 0,
        remaining_cards: availableCards,
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

  const handleSwipeEnd = async (direction: 'left' | 'right') => {
    if (!currentSession) return;

    const isMastered = direction === 'right';
    
    // Update progress
    await updateCardProgress(currentSession.current_card.id, isMastered);

    // Update session stats
    setCurrentSession(prev => prev ? {
      ...prev,
      cards_reviewed: prev.cards_reviewed + 1,
      mastered_count: prev.mastered_count + (isMastered ? 1 : 0),
      still_learning_count: prev.still_learning_count + (isMastered ? 0 : 1)
    } : null);

    // Trigger swipe animation
    setSwipeDirection(direction);
    
    setTimeout(() => {
      setSwipeDirection(null);
      moveToNextCard();
    }, 300);
  };

  const moveToNextCard = () => {
    if (!currentSession) return;

    const currentIndex = currentSession.remaining_cards.findIndex(
      card => card.id === currentSession.current_card.id
    );
    
    const nextCards = currentSession.remaining_cards.slice(currentIndex + 1);
    
    if (nextCards.length === 0) {
      // End of review session
      endReview();
    } else {
      const nextCard = nextCards[0];
      setCurrentSession(prev => prev ? {
        ...prev,
        current_card: nextCard,
        show_definition: false
      } : null);
    }
  };

  const endReview = () => {
    setIsReviewMode(false);
    setCurrentSession(null);
    loadFlashcards(); // Reload to get updated progress
  };

  // Touch event handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    setTouchCurrent({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchCurrent) return;

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = Math.abs(touchCurrent.y - touchStart.y);

    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        handleSwipeEnd('right'); // Swipe right = Mastered
      } else {
        handleSwipeEnd('left'); // Swipe left = Still Learning
      }
    }

    setTouchStart(null);
    setTouchCurrent(null);
  };

  // Mouse event handlers for swipe (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStart) return;
    
    setTouchCurrent({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseUp = () => {
    if (!touchStart || !touchCurrent) return;

    const deltaX = touchCurrent.x - touchStart.x;
    const deltaY = Math.abs(touchCurrent.y - touchStart.y);

    if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        handleSwipeEnd('right');
      } else {
        handleSwipeEnd('left');
      }
    }

    setTouchStart(null);
    setTouchCurrent(null);
  };

  const getCardTransform = () => {
    if (!touchStart || !touchCurrent) return 'translateX(0) rotate(0deg)';
    
    const deltaX = touchCurrent.x - touchStart.x;
    const rotation = deltaX / 20;
    
    return `translateX(${deltaX}px) rotate(${rotation}deg)`;
  };

  const getCardOpacity = () => {
    if (!touchStart || !touchCurrent) return 1;
    
    const deltaX = Math.abs(touchCurrent.x - touchStart.x);
    return Math.max(0.5, 1 - deltaX / 500);
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
    const currentIndex = currentSession.remaining_cards.findIndex(
      card => card.id === currentSession.current_card.id
    );
    const totalCards = currentSession.remaining_cards.length;

    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            {/* Review Header */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={endReview}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span className="font-medium">End Review</span>
                </button>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {currentIndex + 1} / {totalCards}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total Cards</p>
                </div>

                <div className="w-24"></div> {/* Spacer for alignment */}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-lg p-4 text-center border-2 border-red-200">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {currentSession.still_learning_count}
                  </p>
                  <p className="text-xs text-red-700 font-medium mt-1">Still Learning</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    <Repeat className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentSession.cards_reviewed}
                  </p>
                  <p className="text-xs text-blue-700 font-medium mt-1">Reviewed</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {currentSession.mastered_count}
                  </p>
                  <p className="text-xs text-green-700 font-medium mt-1">Mastered</p>
                </div>
              </div>
            </div>

            {/* Swipe Instruction */}
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="flex items-center text-red-600">
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Swipe left: Still Learning</span>
              </div>
              <div className="flex items-center text-green-600">
                <span className="text-sm font-medium">Swipe right: Mastered</span>
                <ArrowLeft className="h-5 w-5 ml-2 transform rotate-180" />
              </div>
            </div>

            {/* Flashcard */}
            <div 
              ref={cardRef}
              className={`bg-white rounded-2xl shadow-xl cursor-pointer select-none transition-all duration-300 ${
                swipeDirection === 'left' ? 'opacity-0 -translate-x-full' :
                swipeDirection === 'right' ? 'opacity-0 translate-x-full' : ''
              }`}
              style={{
                transform: swipeDirection ? undefined : getCardTransform(),
                opacity: swipeDirection ? undefined : getCardOpacity(),
              }}
              onClick={flipCard}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setTouchStart(null);
                setTouchCurrent(null);
              }}
            >
              <div className="p-8 md:p-12">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getSubjectColor(currentSession.current_card.subject)}`}>
                      {currentSession.current_card.subject}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(currentSession.current_card.difficulty)}`}>
                      {currentSession.current_card.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Brain className="h-4 w-4" />
                    <span className="font-medium">{getStatusText(currentSession.current_card.id)}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="min-h-[350px] flex flex-col items-center justify-center">
                  {!currentSession.show_definition ? (
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                          <BookOpen className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        {currentSession.current_card.word}
                      </h2>
                      {currentSession.current_card.pronunciation && (
                        <p className="text-xl text-gray-500 mb-6">
                          {currentSession.current_card.pronunciation}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm">Click card to flip</p>
                    </div>
                  ) : (
                    <div className="text-center w-full">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                          Definition
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed mb-6">
                          {currentSession.current_card.definition}
                        </p>
                        <div className="border-t border-blue-200 pt-6">
                          <h4 className="text-sm font-bold text-gray-900 mb-3">Example Sentence</h4>
                          <p className="text-gray-600 italic leading-relaxed">
                            "{currentSession.current_card.example_sentence}"
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-400 text-sm">Swipe or click to continue</p>
                    </div>
                  )}
                </div>

                {/* Quick Action Buttons (visible only when definition is shown) */}
                {currentSession.show_definition && (
                  <div className="flex justify-center space-x-4 mt-8">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipeEnd('left');
                      }}
                      className="flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Still Learning
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipeEnd('right');
                      }}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mastered
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-6">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                />
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
              disabled={filteredFlashcards.filter(card => {
                const status = getStatusText(card.id);
                return status === 'Still Learning' || status === 'New';
              }).length === 0}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Review
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cards</p>
                  <p className="text-2xl font-bold text-gray-900">{flashcards.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mastered</p>
                  <p className="text-2xl font-bold text-green-600">
                    {progress.filter(p => p.is_mastered).length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Still Learning</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {flashcards.filter(card => getStatusText(card.id) === 'Still Learning').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Cards</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {flashcards.filter(card => getStatusText(card.id) === 'New').length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
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
                <option value="learning">Still Learning</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
          </div>

          {/* Flashcards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlashcards.map((card) => {
              const cardProgress = progress.find(p => p.flashcard === card.id);
              return (
                <div key={card.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all transform hover:-translate-y-1">
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
                          {!cardProgress.is_mastered && (
                            <span>Next: {formatDate(cardProgress.next_review_date)}</span>
                          )}
                        </div>
                        {cardProgress.is_mastered && (
                          <div className="flex items-center mt-2 text-green-600">
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
                          mastered_count: 0,
                          still_learning_count: 0,
                          remaining_cards: [card],
                          current_card: card,
                          show_definition: false
                        });
                        setIsReviewMode(true);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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