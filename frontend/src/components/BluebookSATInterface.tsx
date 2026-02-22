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
  is_math_input?: boolean;
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
  const [showReviewPopup, setShowReviewPopup] = useState(false);

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

  const renderQuestionSide = () => {
    if (!currentQuestion) return null;
    return (
      <>
        <div className="flex items-start mb-6">
          <div className="bg-gray-900 text-white font-bold text-lg px-3 py-1 mr-4 rounded-[2px]">{currentQuestionIndex + 1}</div>
          <button
            onClick={() => toggleFlaggedQuestion(currentQuestion.id)}
            className="flex items-center text-sm font-semibold select-none group"
          >
            <Flag className={`h-5 w-5 mr-2 ${isQuestionFlagged(currentQuestion.id) ? 'text-[#c62828] fill-current' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span>Mark for Review</span>
          </button>
          <span className="flex-1 border-b-2 border-dashed border-gray-300 ml-4 translate-y-3"></span>
          <div className="ml-4 flex items-center bg-gray-100 px-2 py-1 rounded border border-gray-200 font-serif line-through decoration-2 select-none w-10 justify-center">ABC</div>
        </div>

        <div className="mb-8">
          <p className="text-[17px] leading-relaxed text-gray-900">{currentQuestion.question_text}</p>
        </div>

        {currentQuestion.is_math_input ? (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Enter answer..."
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => selectAnswer(currentQuestion.id, e.target.value)}
              className="w-full max-w-sm px-4 py-3 border border-gray-400 rounded text-xl font-medium focus:ring-0 focus:border-blue-600 outline-none shadow-sm"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const isSelected = answers[currentQuestion.id] === key;
              return (
                <label
                  key={key}
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-colors ${isSelected
                    ? 'border-[#3752c6] bg-blue-50/30'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 font-bold ${isSelected ? 'border-[#3752c6] bg-[#3752c6] text-white' : 'border-gray-400 text-gray-700'
                    }`}>
                    {key}
                  </div>
                  <input
                    type="radio"
                    name="answer"
                    value={key}
                    checked={isSelected}
                    onChange={() => selectAnswer(currentQuestion.id, key)}
                    className="hidden"
                  />
                  <span className="text-[17px] text-gray-900 leading-[1.6] pt-1 flex-1">
                    {value}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // Taking Phase
  if (examPhase === 'taking' && currentModule && currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Top Header matching reference image */}
        <div className="bg-white border-b border-gray-300 px-6 py-3 flex items-center justify-between shadow-sm relative z-20">
          <div className="flex-1 flex flex-col">
            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">
              Section {currentModule.section.section_order}, Module {currentModule.module_order}: {currentModule.section.section_type === 'READING_WRITING' ? 'Reading and Writing' : 'Math'}
            </h1>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-sm font-semibold cursor-pointer select-none text-gray-800 flex items-center">
                Directions <ChevronRight className="h-4 w-4 ml-0.5 rotate-90" />
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className={`text-2xl font-bold tracking-widest ${getTimeColor()}`}>
              {formatTime(timeRemaining)}
            </div>
            <button className="text-xs font-bold px-4 py-0.5 border-2 border-gray-400/70 text-gray-600 rounded-full mt-1.5 hover:bg-gray-100 uppercase tracking-widest">Hide</button>
          </div>

          <div className="flex-1 flex justify-end items-center space-x-6 text-xs font-bold text-gray-600 uppercase">
            {currentModule.section.section_type === 'MATH' && (
              <button onClick={() => setCalculatorVisible(true)} className="flex flex-col items-center hover:text-black">
                <Calculator className="h-5 w-5 mb-1" strokeWidth={1.5} />
                <span>Calculator</span>
              </button>
            )}
            <button className="flex flex-col items-center hover:text-black">
              <span className="text-xl font-serif mb-[5px] leading-none opacity-80" style={{ transform: 'scale(1.2)' }}>✐</span>
              <span>Annotate</span>
            </button>
            <button className="flex flex-col items-center hover:text-black mt-[-4px]">
              <span className="text-2xl leading-none mb-0 tracking-widest pb-[1px]">⋮</span>
              <span>More</span>
            </button>
          </div>
        </div>

        {/* decorative dotted border */}
        <div className="w-full h-[6px] bg-white flex opacity-50 relative z-20">
          {/* Simulate the yellow/blue/black dash border */}
          <div className="flex-1 border-b-4 border-dashed border-yellow-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-blue-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-gray-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-yellow-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-blue-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-gray-400"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative bg-white pb-4">
          {currentModule.section.section_type === 'READING_WRITING' || currentQuestion.passage ? (
            // Split view for Reading and Writing
            <div className="flex w-full h-full">
              {/* Left Side: Passage */}
              <div className="w-1/2 border-r-[3px] border-gray-300 p-8 overflow-y-auto relative">
                <div className="absolute top-4 right-4 bg-gray-100 p-1.5 rounded text-gray-500 cursor-pointer border border-gray-300 hover:bg-gray-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="text-[17px] leading-[1.8] text-gray-900 font-serif pr-4 pt-10">
                  {currentQuestion.passage ? currentQuestion.passage : 'No passage provided.'}
                </div>
              </div>
              {/* Right Side: Question */}
              <div className="w-1/2 p-8 overflow-y-auto relative">
                {renderQuestionSide()}
              </div>
            </div>
          ) : (
            // Single view for Math (mostly)
            <div className="w-full h-full max-w-4xl mx-auto p-12 overflow-y-auto relative">
              {renderQuestionSide()}
            </div>
          )}
        </div>

        {/* decorative dotted border */}
        <div className="w-full h-[6px] bg-white flex opacity-50 relative z-30 pointer-events-none">
          <div className="flex-1 border-b-4 border-dashed border-yellow-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-blue-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-gray-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-yellow-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-blue-400"></div>
          <div className="flex-1 border-b-4 border-dashed border-gray-400"></div>
        </div>

        {/* Footer */}
        <div className="bg-white px-8 py-3 relative z-30">

          <div className="flex items-center justify-between">
            <div className="w-32">
              <button
                onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                style={{ visibility: currentQuestionIndex === 0 ? 'hidden' : 'visible' }}
                className="px-8 py-[10px] bg-[#3752c6] text-white rounded-full font-bold hover:bg-blue-700 transition"
              >
                Back
              </button>
            </div>

            <div className="relative flex justify-center flex-1 z-40">
              <button
                onClick={() => setShowReviewPopup(!showReviewPopup)}
                className="flex items-center bg-[#1a1a1a] text-white px-5 py-[10px] rounded hover:bg-black transition-colors"
              >
                <span className="font-bold text-[15px]">Question {currentQuestionIndex + 1} of {currentModule.questions.length}</span>
                <ChevronRight className={`h-5 w-5 ml-1 transition-transform stroke-[3px] ${showReviewPopup ? 'rotate-90' : '-rotate-90'}`} />
              </button>

              {/* Review Popup (Dropdown) */}
              {showReviewPopup && (
                <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 bg-white rounded shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-gray-300 p-6 w-[450px]">
                  <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-[18px] h-[18px] bg-white border-r border-b border-gray-300 transform rotate-45"></div>

                  <div className="flex items-start justify-between border-b border-gray-300 pb-3 mb-4">
                    <h3 className="font-bold text-[17px] text-gray-900 w-full text-center pr-4 leading-[1.2]">
                      Section {currentModule.section.section_order}, Module {currentModule.module_order}: {currentModule.section.section_type === 'READING_WRITING' ? 'Reading and Writing' : 'Math'} <br /> Questions
                    </h3>
                    <button onClick={() => setShowReviewPopup(false)} className="text-gray-500 hover:text-black translate-x-1 -translate-y-1">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center space-x-6 text-[13px] font-semibold text-gray-500 mb-6">
                    <div className="flex items-center">
                      <span className="w-[18px] h-[22px] rounded-sm border-[2px] border-dashed border-gray-400 mr-1.5 flex flex-col items-center pt-[2px]">
                        <span className="w-1.5 h-1.5 rounded-full border border-black/80 flex items-center justify-center"><span className="w-0.5 h-0.5 bg-black rounded-full"></span></span>
                        <span className="w-0.5 h-[6px] bg-black/80"></span>
                      </span>
                      Current
                    </div>
                    <div className="flex items-center">
                      <span className="w-5 h-6 border-[2px] border-dashed border-gray-400 mr-2 rounded-sm"></span>
                      Unanswered
                    </div>
                    <div className="flex items-center text-[#c62828]">
                      <Flag className="h-4 w-4 fill-current mr-1 text-[#c62828]" />
                      For Review
                    </div>
                  </div>

                  <div className="grid grid-cols-10 gap-x-[14px] gap-y-[18px] px-2 relative z-50">
                    {currentModule.questions.map((q, idx) => {
                      const isAnswered = !!answers[q.id];
                      const isFlagged = isQuestionFlagged(q.id);
                      const isCurrent = idx === currentQuestionIndex;

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            navigateToQuestion(idx);
                            setShowReviewPopup(false);
                          }}
                          className="relative flex flex-col items-center"
                        >
                          <div className={`w-[30px] h-[34px] flex items-center justify-center font-bold text-[15px] rounded-sm
                                      ${isAnswered ? 'bg-[#3752c6] text-white' : 'bg-white border-[2px] border-dashed border-gray-400 text-[#3752c6]'}
                                      ${isCurrent ? 'ring-2 ring-offset-2 ring-black bg-[#3752c6] text-white border-none' : ''}
                                  `}>
                            {idx + 1}
                          </div>
                          {isFlagged && (
                            <Flag className="absolute -top-2 -right-2 h-4 w-4 text-[#c62828] fill-current" />
                          )}
                          {isCurrent && (
                            <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-2 h-2">
                              <span className="w-full h-full flex flex-col items-center mix-blend-multiply">
                                <span className="w-1.5 h-1.5 rounded-full border border-black flex items-center justify-center"><span className="w-0.5 h-0.5 bg-black rounded-full"></span></span>
                                <span className="w-0.5 h-1.5 bg-black"></span>
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex justify-center mb-2">
                    <button onClick={() => setShowReviewPopup(false)} className="px-6 py-[6px] bg-white border-2 border-[#3752c6] text-[#3752c6] rounded-full font-bold hover:bg-blue-50 transition text-[15px]">
                      Go to Review Page
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-32 flex justify-end">
              {currentQuestionIndex === currentModule.questions.length - 1 ? (
                <button
                  onClick={submitCurrentModule}
                  disabled={isLoading}
                  className="px-8 py-[10px] bg-[#3752c6] text-white rounded-full font-bold hover:bg-blue-700 transition"
                >
                  {isLoading ? '...' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                  className="px-8 py-[10px] bg-[#3752c6] text-white rounded-full font-bold hover:bg-blue-700 transition"
                >
                  Next
                </button>
              )}
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
