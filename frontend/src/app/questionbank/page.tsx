'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Brain,
  Filter,
  Search,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectColor, getDifficultyColor } from '@/utils/helpers';
import { questionBankApi } from '@/utils/api';

interface Question {
  id: number;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TEXT' | 'MATH' | 'READING' | 'WRITING' | 'GRID_RESPONSE';
  subject?: 'MATH' | 'READING' | 'WRITING';
  difficulty: number | 'EASY' | 'MEDIUM' | 'HARD';
  correct_answer?: string;
  explanation?: string;
  options?: Record<string, string> | string[];
  tags: string[];
  attempt_count?: number;
  accuracy_rate?: number;
}

interface PracticeSession {
  id: number;
  started_at: string;
  questions_answered: number;
  correct_answers: number;
  time_spent: number;
}

export default function QuestionBankPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [sessionStats, setSessionStats] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>(
    subjectParam ? subjectParam.toUpperCase() : 'all'
  );
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [attemptFeedback, setAttemptFeedback] = useState<{ is_correct: boolean; explanation: string; correct_answer: string } | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const difficultyToNumber = (d: string) => ({ EASY: 1, MEDIUM: 3, HARD: 5 }[d] || undefined);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await questionBankApi.getQuestions({
          question_type: filterSubject !== 'all' ? filterSubject : (filterType !== 'all' ? filterType : undefined),
          difficulty: filterDifficulty !== 'all' ? difficultyToNumber(filterDifficulty) : undefined,
          search: searchTerm || undefined,
          page,
          page_size: 20
        }) as { results?: Question[]; count?: number; next?: string; previous?: string } | Question[];
        if (Array.isArray(response)) {
          setQuestions(response);
          setTotalCount(response.length);
          setHasNext(false);
          setHasPrev(false);
        } else {
          setQuestions(response.results || []);
          setTotalCount(response.count ?? (response.results?.length ?? 0));
          setHasNext(!!response.next);
          setHasPrev(!!response.previous);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        setQuestions([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrev(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [filterSubject, filterDifficulty, filterType, searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [filterSubject, filterDifficulty, filterType, searchTerm]);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = !searchTerm || (q.question_text?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (q.tags || []).some((tag: string) => (tag?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    const matchesSubject = filterSubject === 'all' || q.question_type === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || (q.difficulty === difficultyToNumber(filterDifficulty));
    const matchesType = filterType === 'all' || q.question_type === filterType;
    return matchesSearch && matchesSubject && matchesDifficulty && matchesType;
  });

  const startPractice = () => {
    const availableQuestions = filteredQuestions.length > 0 ? filteredQuestions : questions;
    if (availableQuestions.length > 0) {
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      setCurrentQuestion(randomQuestion);
      setIsPracticeMode(true);
      setSelectedAnswer('');
      setShowExplanation(false);
      setSessionStats({
        id: Date.now(),
        started_at: new Date().toISOString(),
        questions_answered: 0,
        correct_answers: 0,
        time_spent: 0
      });
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    setShowExplanation(true);

    // Save attempt to backend
    try {
      await questionBankApi.submitAttempt({
        question: currentQuestion.id,
        selected_answer: selectedAnswer,
        time_taken_seconds: sessionStats ? Math.floor((Date.now() - new Date(sessionStats.started_at).getTime()) / 1000) : 0,
        attempt_type: 'PRACTICE'
      });
    } catch (error) {
      console.error('Error saving attempt:', error);
    }

    setSessionStats(prev => prev ? {
      ...prev,
      questions_answered: prev.questions_answered + 1,
      correct_answers: prev.correct_answers + (isCorrect ? 1 : 0)
    } : null);
  };

  const nextQuestion = () => {
    const availableQuestions = filteredQuestions.length > 0 ? filteredQuestions : questions;
    const remainingQuestions = availableQuestions.filter(q => q.id !== currentQuestion?.id);
    setAttemptFeedback(null);

    if (remainingQuestions.length > 0) {
      const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
      setCurrentQuestion(randomQuestion);
      setSelectedAnswer('');
      setShowExplanation(false);
    } else {
      setIsPracticeMode(false);
      setCurrentQuestion(null);
    }
  };

  const endPractice = () => {
    setIsPracticeMode(false);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setShowExplanation(false);
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

  if (isPracticeMode && currentQuestion) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            {/* Practice Header */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Practice Mode</h1>
                <button
                  onClick={endPractice}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Exit Practice
                </button>
              </div>

              {sessionStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{sessionStats.questions_answered}</p>
                    <p className="text-sm text-gray-500">Questions Answered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {sessionStats.questions_answered > 0
                        ? Math.round((sessionStats.correct_answers / sessionStats.questions_answered) * 100)
                        : 0}%
                    </p>
                    <p className="text-sm text-gray-500">Accuracy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{sessionStats.correct_answers}</p>
                    <p className="text-sm text-gray-500">Correct Answers</p>
                  </div>
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-lg shadow p-8">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(currentQuestion.question_type)}`}>
                    {currentQuestion.subject}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(typeof currentQuestion.difficulty === 'number' ? ({ 1: 'EASY', 2: 'EASY', 3: 'MEDIUM', 4: 'HARD', 5: 'HARD' } as Record<number, string>)[currentQuestion.difficulty] || 'MEDIUM' : currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {currentQuestion.question_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Brain className="h-4 w-4" />
                  <span>Accuracy: {currentQuestion.accuracy_rate}%</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.question_text}
                </h2>

                {/* Answer Options */}
                {currentQuestion.question_type === 'MULTIPLE_CHOICE' && currentQuestion.options && (() => {
                  const raw = currentQuestion.options as Record<string, string> | string[];
                  const entries: [string, string][] = Array.isArray(raw)
                    ? raw.map((text, i) => [String.fromCharCode(65 + i), text])
                    : Object.entries(raw);
                  const correctKey = (attemptFeedback?.correct_answer ?? '').toUpperCase();
                  return (
                    <div className="space-y-3">
                      {entries.map(([letter, text]) => {
                        const isCorrectOption = showExplanation && letter === correctKey;
                        const isWrongSelected = showExplanation && selectedAnswer === letter && letter !== correctKey;
                        return (
                          <label
                            key={letter}
                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedAnswer === letter ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} ${isCorrectOption ? 'border-green-500 bg-green-50' : ''} ${isWrongSelected ? 'border-red-500 bg-red-50' : ''}`}
                          >
                            <input type="radio" name="answer" value={letter} checked={selectedAnswer === letter} onChange={(e) => setSelectedAnswer(e.target.value)} disabled={showExplanation} className="mr-3" />
                            <span className="flex-1">{text}</span>
                            {isCorrectOption && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {isWrongSelected && <XCircle className="h-5 w-5 text-red-500" />}
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}

                {currentQuestion.question_type === 'TEXT' && (
                  <textarea
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={showExplanation}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    rows={4}
                  />
                )}
              </div>

              {/* Explanation from backend after submit */}
              {showExplanation && attemptFeedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Explanation</h3>
                  <p className="text-blue-800">{attemptFeedback.explanation || 'No explanation available.'}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">
                  Question {currentQuestion.id} • {currentQuestion.attempt_count} attempts
                </div>
                <div className="flex space-x-3">
                  {!showExplanation ? (
                    <button
                      onClick={submitAnswer}
                      disabled={!selectedAnswer}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Next Question
                    </button>
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
              <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
              <p className="text-gray-600">Practice with thousands of SAT questions</p>
            </div>
            <button
              onClick={startPractice}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Practice
            </button>
          </div>

          {/* Filter Indicator */}
          {subjectParam && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Filtering by subject: <span className="font-bold">{subjectParam}</span>
                </span>
              </div>
              <button
                onClick={() => setFilterSubject('all')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Math</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.question_type === 'MATH').length}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reading</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.question_type === 'READING').length}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Writing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.question_type === 'WRITING').length}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-orange-600" />
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
                  placeholder="Search questions..."
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TEXT">Text Response</option>
                <option value="MATH">Math Entry</option>
              </select>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubjectColor(question.question_type)}`}>
                        {question.question_type}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(typeof question.difficulty === 'number' ? ({ 1: 'EASY', 2: 'EASY', 3: 'MEDIUM', 4: 'HARD', 5: 'HARD' } as Record<number, string>)[question.difficulty] || 'MEDIUM' : question.difficulty)}`}>
                        {typeof question.difficulty === 'number' ? ({ 1: 'EASY', 2: 'EASY', 3: 'MEDIUM', 4: 'HARD', 5: 'HARD' } as Record<number, string>)[question.difficulty] || question.difficulty : question.difficulty}
                      </span>
                    </div>
                    {question.accuracy_rate != null && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Brain className="h-3 w-3" />
                        <span>{question.accuracy_rate}%</span>
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-3">
                    {question.question_text}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(question.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    {question.attempt_count != null && <span>{question.attempt_count} attempts</span>}
                    <span>{question.question_type?.replace('_', ' ') || ''}</span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setCurrentQuestion(question);
                      setIsPracticeMode(true);
                      setSelectedAnswer('');
                      setShowExplanation(false);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Practice Question
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(hasNext || hasPrev) && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} {totalCount > 0 && `• ${totalCount} total`}</span>
              <button
                type="button"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNext}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredQuestions.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500">
                {searchTerm || filterSubject !== 'all' || filterDifficulty !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start practicing to see questions here'}
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
