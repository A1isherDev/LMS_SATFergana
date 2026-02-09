/**
 * Bluebook Digital SAT Interface Component
 * Follows the exact structure and rules of the official Digital SAT
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChevronLeft, ChevronRight, Flag, Calculator, X } from 'lucide-react';
import DesmosCalculator from './DesmosCalculator';
import { toast } from 'react-hot-toast';

// Types for Bluebook Digital SAT
interface BluebookExam {
  id: number;
  title: string;
  description: string;
  total_duration_minutes: number;
}

interface BluebookSection {
  id: number;
  exam: BluebookExam;
  section_type: 'READING_WRITING' | 'MATH';
  section_order: number;
  total_duration_minutes: number;
}

interface BluebookModule {
  id: number;
  section: BluebookSection;
  module_order: number;
  time_limit_minutes: number;
  difficulty_level: 'BASELINE' | 'EASIER' | 'HARDER';
  is_adaptive: boolean;
  questions: BluebookQuestion[];
}

interface BluebookQuestion {
  id: number;
  question_text: string;
  question_type: 'MATH' | 'READING' | 'WRITING';
  options: Record<string, string>;
  correct_answer: string;
  passage?: string;
  explanation?: string;
  difficulty: number;
  estimated_time_seconds: number;
  is_active: boolean;
}

interface BluebookExamAttempt {
  id: number;
  exam: BluebookExam;
  student: any;
  started_at?: string;
  submitted_at?: string;
  is_completed: boolean;
  current_section?: BluebookSection;
  current_module?: BluebookModule;
  completed_modules: BluebookModule[];
  current_module_time_remaining: number;
  current_progress: number;
}

// API Service
class BluebookAPI {
  async startExam(examId: number): Promise<any> {
    const { bluebookApi } = await import('@/utils/api');
    return bluebookApi.startExam(examId);
  }

  async startAttempt(attemptId: number): Promise<any> {
    const { bluebookApi } = await import('@/utils/api');
    return bluebookApi.startAttempt(attemptId);
  }

  async getStatus(attemptId: number): Promise<any> {
    const { bluebookApi } = await import('@/utils/api');
    return bluebookApi.getStatus(attemptId);
  }

  async getCurrentModule(attemptId: number): Promise<any> {
    const { bluebookApi } = await import('@/utils/api');
    return bluebookApi.getCurrentModule(attemptId);
  }

  async submitModule(attemptId: number, data: { 
    answers: Record<string, string>; 
    flagged_questions?: number[] 
  }): Promise<any> {
    const { bluebookApi } = await import('@/utils/api');
    return bluebookApi.submitModule(attemptId, { answers: data.answers, flagged_questions: data.flagged_questions });
  }

  async flagQuestion(attemptId: number, data: { 
    question_id: number; 
    flagged: boolean 
  }): Promise<any> {
    const { bluebookApi } = await import('@/utils/api');
    return bluebookApi.flagQuestion(attemptId, { question_id: data.question_id, flagged: data.flagged });
  }

  async getResults(attemptId: number): Promise<any> {
    const { bluebookApi } = await import('@/utils/api');
    return bluebookApi.getResults(attemptId);
  }
}

// Main Component
const BluebookSATInterface: React.FC<{ examId: number }> = ({ examId }) => {
  const router = useRouter();
  const api = new BluebookAPI();
  
  // State management
  const [attempt, setAttempt] = useState<BluebookExamAttempt | null>(null);
  const [currentModule, setCurrentModule] = useState<BluebookModule | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [examPhase, setExamPhase] = useState<'instructions' | 'taking' | 'completed' | 'results'>('instructions');
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [calculatorMinimized, setCalculatorMinimized] = useState(false);
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const moduleStartTime = useRef<Date | null>(null);

  // Initialize exam
  useEffect(() => {
    initializeExam();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeExam = async () => {
    try {
      setIsLoading(true);
      
      // Start exam attempt
      const attemptData = await api.startExam(examId);
      setAttempt(attemptData);
      
      // Start the exam
      const statusData = await api.startAttempt(attemptData.id);
      setAttempt(statusData);
      
      // Get current module
      const moduleData = await api.getCurrentModule(attemptData.id);
      setCurrentModule(moduleData);
      
      // Set time remaining
      if (moduleData) {
        setTimeRemaining(moduleData.time_limit_minutes * 60);
      }
      
      setExamPhase('taking');
    } catch (error) {
      console.error('Error initializing exam:', error);
      toast.error('Failed to start exam');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (examPhase === 'taking' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            submitCurrentModule();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examPhase, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-600';
    if (timeRemaining <= 600) return 'text-orange-600';
    return 'text-green-600';
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < (currentModule?.questions.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  };

  const selectAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlaggedQuestion = (questionId: number) => {
    setFlaggedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const isQuestionFlagged = (questionId: number) => {
    return flaggedQuestions.includes(questionId);
  };

  const submitCurrentModule = async () => {
    if (!attempt || !currentModule) return;
    
    try {
      setIsLoading(true);
      
      // Submit current module
      const newStatus = await api.submitModule(
        attempt.id,
        { answers, flagged_questions: flaggedQuestions }
      );
      
      setAttempt(newStatus);
      
      // Check if exam is completed
      if (newStatus.is_completed) {
        setExamPhase('completed');
        const results = await api.getResults(attempt.id);
        setAttempt(results);
      } else {
        // Get next module
        const nextModule = await api.getCurrentModule(attempt.id);
        setCurrentModule(nextModule);
        setTimeRemaining(nextModule.time_limit_minutes * 60);
        setCurrentQuestionIndex(0);
      }
      
      toast.success('Module submitted successfully');
    } catch (error) {
      console.error('Error submitting module:', error);
      toast.error('Failed to submit module');
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = currentModule?.questions[currentQuestionIndex];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Digital SAT...</p>
        </div>
      </div>
    );
  }

  // Instructions Phase
  if (examPhase === 'instructions') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Digital SAT Instructions</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Test Structure</h2>
              <div className="space-y-2 text-gray-700">
                <p>• Reading & Writing: 2 modules, 32 minutes each</p>
                <p>• Math: 2 modules, 35 minutes each</p>
                <p>• Total time: 2 hours 14 minutes</p>
                <p>• Module 2 adapts based on Module 1 performance</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Rules</h2>
              <div className="space-y-2 text-gray-700">
                <p>• You cannot return to previous modules</p>
                <p>• Calculator available in Math modules only</p>
                <p>• Flag questions to review later</p>
                <p>• Time continues even if you leave the test</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Scoring</h2>
              <div className="space-y-2 text-gray-700">
                <p>• Total score: 400-1600</p>
                <p>• Reading & Writing: 200-800</p>
                <p>• Math: 200-800</p>
                <p>• Adaptive difficulty affects score potential</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setExamPhase('taking')}
            className="mt-8 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Start Test'}
          </button>
        </div>
      </div>
    );
  }

  // Taking Phase
  if (examPhase === 'taking' && currentModule && currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentModule.section.section_type === 'READING_WRITING' ? 'Reading & Writing' : 'Math'} - Module {currentModule.module_order}
              </h1>
              {currentModule.is_adaptive && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  {currentModule.difficulty_level}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {currentModule.section.section_type === 'MATH' && (
                <button
                  onClick={() => setCalculatorVisible(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Open Desmos Calculator"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculator
                </button>
              )}
              
              <div className={`text-2xl font-mono ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 max-w-7xl mx-auto w-full">
          {/* Question Grid Sidebar */}
          <div className="w-20 bg-white border-r border-gray-200 p-4">
            <div className="grid grid-cols-5 gap-1">
              {currentModule.questions.map((question, index) => {
                const isAnswered = answers[question.id];
                const isFlagged = isQuestionFlagged(question.id);
                let bgColor = 'bg-gray-200';
                
                if (isFlagged) bgColor = 'bg-yellow-500';
                else if (isAnswered) bgColor = 'bg-green-500';
                else if (index === currentQuestionIndex) bgColor = 'bg-blue-500';
                
                return (
                  <button
                    key={question.id}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-8 h-8 text-xs font-medium rounded text-white ${bgColor} ${
                      index === currentQuestionIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-xs text-gray-600">Flagged</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span className="text-xs text-gray-600">Unanswered</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Question */}
            <div className="flex-1 bg-white m-4 rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">
                  Question {currentQuestionIndex + 1} of {currentModule.questions.length}
                </span>
              </div>
              
              {currentQuestion.passage && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{currentQuestion.passage}</p>
                </div>
              )}
              
              <div className="mb-6">
                <p className="text-lg text-gray-900 font-medium">{currentQuestion.question_text}</p>
              </div>
              
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <label
                    key={key}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      answers[currentQuestion.id] === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={key}
                      checked={answers[currentQuestion.id] === key}
                      onChange={() => selectAnswer(currentQuestion.id, key)}
                      className="mr-3"
                    />
                    <span className="text-gray-900">
                      <span className="font-medium mr-2">{key}.</span>
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleFlaggedQuestion(currentQuestion.id)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isQuestionFlagged(currentQuestion.id)
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    {isQuestionFlagged(currentQuestion.id) ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    {currentQuestionIndex + 1} / {currentModule.questions.length}
                  </span>
                  
                  <button
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === currentModule.questions.length - 1}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                  
                  {currentQuestionIndex === currentModule.questions.length - 1 && (
                    <button
                      onClick={submitCurrentModule}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Module'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desmos Calculator */}
        <DesmosCalculator
          isVisible={calculatorVisible}
          onClose={() => setCalculatorVisible(false)}
          isMinimized={calculatorMinimized}
          onMinimize={() => setCalculatorMinimized(true)}
          onMaximize={() => setCalculatorMinimized(false)}
        />
      </div>
    );
  }

  // Results Phase
  if (examPhase === 'completed' && attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Completed!</h1>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {(attempt as any).total_score || 0}
              </div>
              <div className="text-gray-600">Total Score (400-1600)</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">
                  {(attempt as any).reading_writing_score || 0}
                </div>
                <div className="text-sm text-gray-600">Reading & Writing</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">
                  {(attempt as any).math_score || 0}
                </div>
                <div className="text-sm text-gray-600">Math</div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
              <div className="space-y-2 text-gray-700">
                <p>• Review your incorrect answers to identify improvement areas</p>
                <p>• Focus on sections where you scored below 600</p>
                <p>• Practice time management for faster completion</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Digital SAT...</p>
      </div>
    </div>
  );
};

export default BluebookSATInterface;
