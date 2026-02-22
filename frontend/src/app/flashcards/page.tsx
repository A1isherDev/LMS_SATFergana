'use client';

import { useState, useEffect, useRef } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
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
  Repeat,
  Zap,
  Sparkles,
  ArrowRight,
  Target,
  Trophy,
  Plus
} from 'lucide-react';
import { formatDate, getSubjectColor } from '@/utils/helpers';
import { flashcardsApi } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

import { useSearchParams } from 'next/navigation';
import { Flashcard, FlashcardProgress, ApiResponse } from '@/types';

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
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject');

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<FlashcardProgress[]>([]);
  const [currentSession, setCurrentSession] = useState<ReviewSession | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>(
    subjectParam ? subjectParam.toUpperCase() : 'all'
  );
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
      const [flashcardsResponse, progressResponse] = await Promise.all([
        flashcardsApi.getFlashcards() as Promise<ApiResponse<Flashcard>>,
        flashcardsApi.getProgress() as Promise<ApiResponse<FlashcardProgress>>
      ]);

      setFlashcards(flashcardsResponse.results);
      setProgress(progressResponse.results);
    } catch (error) {
      setFlashcards([]);
      setProgress([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCardProgress = async (flashcardId: number, isMastered: boolean) => {
    try {
      await flashcardsApi.updateProgress(flashcardId, {
        is_correct: isMastered,
        time_spent_seconds: 5
      });

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
            student: user?.id || 0,
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
    } catch (error) { }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-emerald-100/10 text-emerald-500';
      case 'MEDIUM':
        return 'bg-blue-100/10 text-blue-500';
      case 'HARD':
        return 'bg-rose-100/10 text-rose-500';
      default:
        return 'bg-slate-100/10 text-slate-500';
    }
  };

  const getStatusColor = (flashcardId: number) => {
    const cardProgress = progress.find(p => p.flashcard === flashcardId);
    if (!cardProgress) return 'bg-slate-100/10 text-slate-500';
    if (cardProgress.is_mastered) return 'bg-emerald-100/10 text-emerald-500';
    return 'bg-orange-100/10 text-orange-500';
  };

  const getStatusText = (flashcardId: number) => {
    const cardProgress = progress.find(p => p.flashcard === flashcardId);
    if (!cardProgress) return 'New';
    if (cardProgress.is_mastered) return 'Mastered';
    return 'Learning';
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
          matchesStatus = status === 'Learning';
          break;
      }
    }

    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  const startReview = () => {
    const availableCards = filteredFlashcards.filter(card => {
      const status = getStatusText(card.id);
      return status === 'Learning' || status === 'New';
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
    await updateCardProgress(currentSession.current_card.id, isMastered);
    setCurrentSession(prev => prev ? {
      ...prev,
      cards_reviewed: prev.cards_reviewed + 1,
      mastered_count: prev.mastered_count + (isMastered ? 1 : 0),
      still_learning_count: prev.still_learning_count + (isMastered ? 0 : 1)
    } : null);
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
    loadFlashcards();
  };

  // Swipe interaction logic simplified for premium feel
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  const handleTouchMove = (e: React.TouchEvent) => touchStart && setTouchCurrent({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  const handleTouchEnd = () => {
    if (!touchStart || !touchCurrent) return;
    const deltaX = touchCurrent.x - touchStart.x;
    if (Math.abs(deltaX) > 120) handleSwipeEnd(deltaX > 0 ? 'right' : 'left');
    setTouchStart(null); setTouchCurrent(null);
  };
  const handleMouseDown = (e: React.MouseEvent) => setTouchStart({ x: e.clientX, y: e.clientY });
  const handleMouseMove = (e: React.MouseEvent) => touchStart && setTouchCurrent({ x: e.clientX, y: e.clientY });
  const handleMouseUp = () => {
    if (!touchStart || !touchCurrent) return;
    const deltaX = touchCurrent.x - touchStart.x;
    if (Math.abs(deltaX) > 120) handleSwipeEnd(deltaX > 0 ? 'right' : 'left');
    setTouchStart(null); setTouchCurrent(null);
  };

  const getCardTransform = () => {
    if (!touchStart || !touchCurrent) return 'translateX(0) rotate(0deg)';
    const deltaX = touchCurrent.x - touchStart.x;
    return `translateX(${deltaX}px) rotate(${deltaX / 15}deg)`;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (isReviewMode && currentSession) {
    const currentIndex = currentSession.remaining_cards.findIndex(card => card.id === currentSession.current_card.id);
    const totalCards = currentSession.remaining_cards.length;

    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Review Header Stats */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Brain className="h-40 w-40" />
              </div>
              <div className="relative z-10 flex items-center justify-between mb-10">
                <button onClick={endReview} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Terminate Session
                </button>
                <div className="text-right">
                  <p className="text-4xl font-black italic tracking-tighter text-blue-400">{currentIndex + 1} <span className="text-slate-600">/</span> {totalCards}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sequence Index</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center">
                  <p className="text-2xl font-black italic text-rose-500">{currentSession.still_learning_count}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">Struggling</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center">
                  <p className="text-2xl font-black italic text-blue-500">{currentSession.cards_reviewed}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">Processed</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center">
                  <p className="text-2xl font-black italic text-emerald-500">{currentSession.mastered_count}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">Mastered</p>
                </div>
              </div>
            </div>

            {/* Flashcard Component */}
            <div
              ref={cardRef}
              className={`bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm cursor-pointer select-none transition-all duration-300 relative ${swipeDirection === 'left' ? 'opacity-0 scale-95 -translate-x-full' :
                swipeDirection === 'right' ? 'opacity-0 scale-95 translate-x-full' : ''
                }`}
              style={{ transform: swipeDirection ? undefined : getCardTransform() }}
              onClick={flipCard}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { setTouchStart(null); setTouchCurrent(null); }}
            >
              <div className="p-16 text-center">
                <div className="flex items-center justify-between mb-12">
                  <span className={`px-4 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${getSubjectColor(currentSession.current_card.subject)}`}>
                    {currentSession.current_card.subject}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase italic">
                    <Sparkles className="h-4 w-4" />
                    Neural Sync: {getStatusText(currentSession.current_card.id)}
                  </div>
                </div>

                <div className="min-h-[300px] flex flex-col items-center justify-center">
                  {!currentSession.show_definition ? (
                    <div className="space-y-6">
                      <div className="h-20 w-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <Zap className="h-10 w-10 text-blue-600" />
                      </div>
                      <h2 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase underline decoration-blue-500/20 underline-offset-8">
                        {currentSession.current_card.word}
                      </h2>
                      {currentSession.current_card.pronunciation && (
                        <p className="text-xl font-medium text-slate-400 font-mono">
                          [{currentSession.current_card.pronunciation}]
                        </p>
                      )}
                      <p className="text-[10px] font-black text-slate-300 tracking-[0.3em] uppercase pt-12">Interaction Required: Flip</p>
                    </div>
                  ) : (
                    <div className="w-full space-y-12">
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-12 border border-slate-100 dark:border-gray-700">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                          <Target className="h-4 w-4" />
                          Semantic Core
                        </h3>
                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 leading-relaxed max-w-2xl mx-auto italic">
                          {currentSession.current_card.definition}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contextual Application</h4>
                        <p className="text-lg text-slate-500 italic max-w-xl mx-auto">
                          &quot;{currentSession.current_card.example_sentence}&quot;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-center gap-6 pb-20">
              <button
                onClick={(e) => { e.stopPropagation(); handleSwipeEnd('left'); }}
                className="flex items-center px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase italic text-xs tracking-widest hover:bg-rose-600 transition-all shadow-xl hover:-translate-y-1"
              >
                <XCircle className="h-5 w-5 mr-3" />
                Still Learning
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSwipeEnd('right'); }}
                className="flex items-center px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase italic text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-xl hover:-translate-y-1"
              >
                Mastered
                <CheckCircle className="h-5 w-5 ml-3" />
              </button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-12 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Spaced Repetition Engine</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Vocabulary Bank</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2">Activate semantic encoding through high-velocity review cycles.</p>
            </div>
            <div className="flex items-center gap-4">
              {['TEACHER', 'ADMIN'].includes(user?.role || '') && (
                <button
                  onClick={() => window.location.href = '/flashcards/create'}
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-slate-900 dark:text-white border border-slate-200 dark:border-gray-700 rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-3"
                >
                  <Plus className="h-4 w-4" />
                  Add Card
                </button>
              )}
              <button
                onClick={startReview}
                disabled={filteredFlashcards.length === 0}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-3 disabled:opacity-20"
              >
                <Play className="h-4 w-4 fill-current" />
                Pulse Start
              </button>
            </div>
          </div>

          {/* New Stats Layout */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Neural Library</p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-black italic text-slate-900 dark:text-white">{flashcards.length}</span>
                  <BookOpen className="h-8 w-8 text-blue-500/10 group-hover:text-blue-500/30 transition-colors" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-4">Peak Performance</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black italic text-slate-900 dark:text-white">{progress.filter(p => p.is_mastered).length}</span>
                <Trophy className="h-8 w-8 text-emerald-500/20" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm">
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-4">In Transmission</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black italic text-slate-900 dark:text-white">{flashcards.filter(c => getStatusText(c.id) === 'Learning').length}</span>
                <Repeat className="h-8 w-8 text-orange-500/20" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-slate-100 dark:border-gray-700 shadow-sm">
              <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-4">Unprocessed</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black italic text-slate-900 dark:text-white">{flashcards.filter(c => getStatusText(c.id) === 'New').length}</span>
                <Zap className="h-8 w-8 text-purple-500/20" />
              </div>
            </div>
          </div>

          {/* Refined Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 space-y-6">
            <div className="relative w-full">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Query vocabulary database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-slate-500">
                <option value="all">Domain: All</option>
                <option value="MATH">Math Ops</option>
                <option value="READING">Reading Lex</option>
                <option value="WRITING">Writing Syntax</option>
              </select>
              <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-slate-500">
                <option value="all">Gravity: Any</option>
                <option value="EASY">Low Strain</option>
                <option value="MEDIUM">Mid Mass</option>
                <option value="HARD">High Velocity</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-slate-500">
                <option value="all">Sync Status</option>
                <option value="new">Unprocessed</option>
                <option value="learning">Encoding</option>
                <option value="mastered">Retained</option>
              </select>
            </div>
          </div>

          {/* Flashcards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFlashcards.map((card) => {
              const cardProgress = progress.find(p => p.flashcard === card.id);
              return (
                <div key={card.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex flex-col group hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-900/5">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-[8px] font-black rounded-md uppercase tracking-wider ${getSubjectColor(card.subject)}`}>
                        {card.subject}
                      </span>
                      <span className={`px-2 py-1 text-[8px] font-black rounded-md uppercase tracking-wider ${getDifficultyColor(card.difficulty)}`}>
                        {card.difficulty}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 text-[8px] font-black rounded-full uppercase tracking-widest ${getStatusColor(card.id)}`}>
                      {getStatusText(card.id)}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 group-hover:text-blue-600 transition-colors">{card.word}</h3>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6 leading-relaxed line-clamp-3">{card.definition}</p>
                  <p className="text-[11px] font-medium text-slate-400 italic mb-10">&quot;{card.example_sentence}&quot;</p>

                  <div className="mt-auto space-y-6">
                    {cardProgress && (
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Repeat className="h-3 w-3 text-slate-300" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cardProgress.repetition_count} Cycles</span>
                        </div>
                        {cardProgress.is_mastered ? (
                          <div className="flex items-center gap-1 text-emerald-500">
                            <Trophy className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase">Secured</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-slate-400 uppercase">Revise: {formatDate(cardProgress.next_review_date)}</span>
                        )}
                      </div>
                    )}

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
                      className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-600 hover:scale-[1.02] transition-all flex items-center justify-center group/btn"
                    >
                      Initialize Study
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredFlashcards.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Brain className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">Neural Records Clean</h3>
              <p className="text-slate-400 font-medium italic">Adjust semantic target parameters.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
