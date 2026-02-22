'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import MockExamSection from '@/components/MockExamSection';
import { mockExamsApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import { Loader2, AlertTriangle, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react';

interface Question {
  id: number;
  section: string;
  question_text: string;
  options: string[];
}

interface Section {
  name: string;
  questions: Question[];
  time_limit_seconds: number;
  progress_percentage: number;
}

export default function MockExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, Record<number, string>>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setIsLoading(true);
      // First start the exam to ensure an attempt exists
      await mockExamsApi.startExam(parseInt(examId));

      // Fetch sections
      const sectionsResponse: any = await mockExamsApi.getExamSections(parseInt(examId));
      const sectionsData = Array.isArray(sectionsResponse) ? sectionsResponse : (sectionsResponse.data || []);

      if (sectionsData.length === 0) {
        setIsLoading(false);
        return;
      }

      setSections(sectionsData);
      setTimeRemaining(sectionsData[0].time_limit_seconds);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching exam data:', error);
      toast.error('Failed to load exam sections. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAnswerQuestion = (questionId: number, answer: string) => {
    const sectionName = sections[currentSectionIdx].name;
    setAnswers(prev => ({
      ...prev,
      [sectionName]: {
        ...(prev[sectionName] || {}),
        [questionId]: answer
      }
    }));
  };

  const handleNextSection = async () => {
    const currentSection = sections[currentSectionIdx];
    const sectionAnswers = answers[currentSection.name] || {};

    try {
      setIsSubmitting(true);
      // Submit current section
      await mockExamsApi.submitSection(parseInt(examId), {
        section: currentSection.name,
        answers: sectionAnswers as any,
        time_spent_seconds: Math.max(0, currentSection.time_limit_seconds - timeRemaining)
      });

      if (currentSectionIdx < sections.length - 1) {
        // Move to next section
        const nextIdx = currentSectionIdx + 1;
        setCurrentSectionIdx(nextIdx);
        setCurrentQuestionIdx(0);
        setTimeRemaining(sections[nextIdx].time_limit_seconds);
        toast.success(`Completed ${currentSection.name}. Moving to ${sections[nextIdx].name}.`);
      } else {
        // Final submission
        const response: any = await mockExamsApi.submitExam(parseInt(examId));
        toast.success('Exam completed successfully!');

        // Detailed results might be in response.id (attempt ID)
        const attemptId = response?.id || response?.data?.id;
        if (attemptId) {
          router.push(`/mockexams/results/${attemptId}`);
        } else {
          router.push('/mockexams');
        }
      }
    } catch (error) {
      console.error('Error submitting section:', error);
      toast.error('Failed to submit section. Progress might be lost.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
            <div className="relative">
              <div className="h-24 w-24 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">System Initializing</p>
              <p className="text-xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">Loading Test...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (sections.length === 0) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-8" />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">Exam Aborted</h2>
            <p className="text-slate-500 font-medium italic mb-10">The designated module is currently unreachable or contains no data.</p>
            <button
              onClick={() => router.push('/mockexams')}
              className="px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
            >
              Return to Base
            </button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const currentSection = sections[currentSectionIdx];
  const currentQuestion = currentSection.questions[currentQuestionIdx];
  const sectionAnswers = answers[currentSection.name] || {};

  const transformedQuestions = currentSection.questions.map(q => ({
    id: q.id,
    section: currentSection.name,
    questionText: q.question_text,
    options: q.options,
    answered: !!sectionAnswers[q.id]
  }));

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
          {/* Progress Bar & Header */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center space-x-6">
              <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <span className="text-2xl font-black italic">S{currentSectionIdx + 1}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1 block">Active Simulation</span>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Section: {currentSection.name}</h1>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3 flex-1 max-w-md">
              <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Test Progress</span>
                <span className="text-blue-600 italic">Phase {currentSectionIdx + 1} of {sections.length}</span>
              </div>
              <div className="flex items-center space-x-2 w-full">
                {sections.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-full border border-transparent transition-all duration-500 ${idx < currentSectionIdx ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                      idx === currentSectionIdx ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse' : 'bg-slate-100 dark:bg-slate-700'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Question Interface */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-gray-700 p-10 min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center">
                    <span className="h-10 w-10 bg-slate-900 dark:bg-slate-700 text-white rounded-xl flex items-center justify-center font-black italic text-xs mr-4">
                      {currentQuestionIdx + 1 < 10 ? `0${currentQuestionIdx + 1}` : currentQuestionIdx + 1}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Query Identifier: EXM-{currentQuestion.id}
                    </span>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none mb-12 flex-1">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-relaxed italic">
                    {currentQuestion.question_text}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(currentQuestion.options || ['A', 'B', 'C', 'D']).map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerQuestion(currentQuestion.id, option)}
                      className={`w-full flex items-center p-6 rounded-[1.5rem] border-2 transition-all group ${sectionAnswers[currentQuestion.id] === option
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10'
                        : 'border-slate-50 dark:border-gray-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black italic mr-4 transition-all ${sectionAnswers[currentQuestion.id] === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-base font-bold ${sectionAnswers[currentQuestion.id] === option ? 'text-blue-900 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700">
                <button
                  onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIdx === 0}
                  className="px-8 py-4 border-2 border-slate-100 dark:border-gray-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-gray-900 disabled:opacity-30 transition-all font-black uppercase italic tracking-widest text-[10px]"
                >
                  Previous Phase
                </button>

                {currentQuestionIdx < currentSection.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                    className="px-8 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl"
                  >
                    Next Objective
                  </button>
                ) : (
                  <button
                    onClick={handleNextSection}
                    disabled={isSubmitting}
                    className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-blue-500/20 flex items-center"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-3" /> : null}
                    {currentSectionIdx < sections.length - 1 ? 'Continue to Next Section' : 'Submit Test'}
                    <ArrowRight className="h-4 w-4 ml-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <MockExamSection
                sections={sections.map(s => ({ name: s.name, totalQuestions: s.questions.length, timeLimit: s.time_limit_seconds / 60, order: 1 }))}
                questions={transformedQuestions as any}
                currentSection={currentSectionIdx}
                currentQuestion={currentQuestionIdx}
                timeRemaining={timeRemaining}
                onQuestionChange={setCurrentQuestionIdx}
                onTimeUp={handleNextSection}
                showNavigation={false}
              />

              {/* Question Grid */}
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                  <CheckCircle className="h-24 w-24" />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.2em] flex items-center">
                  <TrendingUp className="h-4 w-4 mr-3 text-blue-600" />
                  Telemetry Grid
                </h3>
                <div className="grid grid-cols-5 gap-3 relative z-10">
                  {currentSection.questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-12 w-12 rounded-2xl text-[10px] font-black italic transition-all transform hover:scale-110 ${currentQuestionIdx === idx
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/20'
                        : sectionAnswers[q.id]
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 border border-blue-100 dark:border-blue-900/30'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
                        }`}
                    >
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
