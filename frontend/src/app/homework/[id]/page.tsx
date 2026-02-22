'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Download,
  Eye,
  Check,
  Send,
  BarChart3,
  Trophy,
  ArrowRight,
  Target,
  ChevronLeft,
  ChevronRight,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, getDifficultyColor, getSatScoreColor } from '@/utils/helpers';
import GradingModal from '@/components/GradingModal';
import { homeworkApi } from '@/utils/api';
<<<<<<< HEAD

=======
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c

interface Question {
  id: number;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TEXT' | 'TRUE_FALSE';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
}

interface StudentSubmission {
  id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  submitted_at: string;
  score: number;
  max_score: number;
  is_late: boolean;
  answers: Record<string, string>;
  time_spent_seconds: number;
  feedback?: string;
}

interface HomeworkDetail {
  id: number;
  title: string;
  description: string;
  class_obj: {
    id: number;
    name: string;
  };
  assigned_by: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  due_date: string;
  is_published: boolean;
  total_questions: number;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  created_at: string;
  questions: Question[];
  submissions: StudentSubmission[];
  homework_stats: {
    submission_count: number;
    average_score: number;
    average_time_spent: number;
    on_time_submission_rate: number;
  };
  user_submission?: StudentSubmission;
}

export default function HomeworkDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const homeworkId = params?.id as string;

  const [homework, setHomework] = useState<HomeworkDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'submissions' | 'analytics'>('overview');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchHomeworkDetail = async () => {
    if (!homeworkId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await homeworkApi.getHomeworkDetail(parseInt(homeworkId)) as HomeworkDetail;
      setHomework(data);
      if (data.user_submission?.answers) {
        setUserAnswers(data.user_submission.answers);
      }
    } catch (error) {
      console.error('Error fetching homework detail:', error);
      setHomework(null);
      setFetchError('Failed to load homework. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworkDetail();
  }, [homeworkId]);

  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId.toString()]: answer
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!homework) return;
    if (homework.user_submission) {
      toast('You have already submitted this homework.', { icon: 'ℹ️' });
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting assignment...');

    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
<<<<<<< HEAD

      const formData = new FormData();
      formData.append('answers', JSON.stringify(userAnswers));
      formData.append('time_spent_seconds', timeSpent.toString());
      if (selectedFile) {
        formData.append('submission_file', selectedFile);
      }

      const response = await homeworkApi.submitHomework(homework.id, formData);

      toast.success('Homework submitted successfully!', { id: toastId });
      setHomework(prev => prev ? { ...prev, user_submission: response as any } : null);
    } catch (error: any) {
      console.error('Error submitting homework:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit homework';
      toast.error(`Error: ${errorMessage}`, { id: toastId });
=======
      await homeworkApi.submitHomework(parseInt(homeworkId), {
        answers: userAnswers,
        time_spent_seconds: timeSpent
      });
      alert('Homework submitted successfully!');
      await fetchHomeworkDetail();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to submit homework';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmission = (submission: StudentSubmission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const handleGradeSave = async (grade: number, feedback: string) => {
    if (!selectedSubmission) return; // Use selectedSubmission for grading

    const toastId = toast.loading('Saving grade...');
    try {
      await homeworkApi.gradeSubmission(selectedSubmission.id, { // Use selectedSubmission.id
        score: grade, // Assuming 'score' is the field name for grade
        feedback
      });
      toast.success('Grade saved successfully!', { id: toastId });
      // Refresh submission data or update locally
      if (homework) {
        const updatedSubmissions = homework.submissions.map(s =>
          s.id === selectedSubmission.id ? { ...s, score: grade, feedback } : s
        );
        setHomework({ ...homework, submissions: updatedSubmissions });
      }
      setShowGradingModal(false); // Close modal after saving
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to save grade', { id: toastId });
    }
  };

  const calculateProgress = () => {
    if (!homework?.questions) return 0;
    const answered = Object.keys(userAnswers).length;
    return (answered / homework.questions.length) * 100;
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!homework) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{fetchError ? 'Error Loading Homework' : 'Homework Not Found'}</h2>
            <p className="text-gray-600 mb-4">{fetchError || "The homework you're looking for doesn't exist."}</p>
            <button
              onClick={() => fetchError ? fetchHomeworkDetail() : router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {fetchError ? 'Retry' : 'Go Back'}
            </button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const isOverdue = new Date() > new Date(homework.due_date);
  const isSubmitted = !!homework?.user_submission;
  const canSubmit = !isSubmitted && !isOverdue && user?.role === 'STUDENT';

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start space-x-6">
              <button
                onClick={() => router.back()}
                className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all hover:scale-110"
                title="Back to Homework List"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Instructional Module</span>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{homework.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">{homework.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-6 py-3 text-[10px] font-black rounded-xl uppercase tracking-widest ${getDifficultyColor(homework.difficulty_level)}`}>
                {homework.difficulty_level} THREAT
              </span>
              {isSubmitted && (
                <span className="px-6 py-3 text-[10px] font-black rounded-xl uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                  VERIFIED
                </span>
              )}
              {isOverdue && !isSubmitted && (
                <span className="px-6 py-3 text-[10px] font-black rounded-xl uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-900/20">
                  EXPIRED
                </span>
              )}
            </div>
          </div>

          {/* Homework Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-blue-400 transition-all">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Assigned Cohort</p>
                <p className="text-lg font-black italic text-slate-900 dark:text-white uppercase tracking-tight">{homework.class_obj.name}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-emerald-400 transition-all">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Deadline Protocol</p>
                <p className="text-lg font-black italic text-slate-900 dark:text-white uppercase tracking-tight">{formatDate(homework.due_date)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-purple-400 transition-all">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Query Count</p>
                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">{homework.total_questions}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-orange-400 transition-all">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Engagement</p>
                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">{homework.homework_stats.submission_count}</p>
              </div>
            </div>
          </div>

          {/* Student View - Questions */}
          {user?.role === 'STUDENT' && (
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
              {isSubmitted ? (
                <div className="p-12 text-center">
                  <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Module Completed</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">
                    Transmission received on {formatDateTime(homework.user_submission!.submitted_at)}
                  </p>
                  {homework.user_submission!.score > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-10 max-w-md mx-auto border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Final Rating</p>
                      <p className={`text-5xl font-black italic tracking-tighter mb-2 ${getSatScoreColor(homework.user_submission!.score)}`}>
                        {homework.user_submission!.score}/{homework.user_submission!.max_score}
                      </p>
                      <p className="text-sm font-black italic text-slate-400 uppercase tracking-widest">
                        {Math.round((homework.user_submission!.score / homework.user_submission!.max_score) * 100)}% Proficiency
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => router.push('/homework')}
                    className="mt-12 px-10 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
                  >
                    Return to Assignments
                  </button>
                </div>
              ) : (
                <>
                  {/* Progress Bar */}
                  <div className="p-10 border-b border-slate-50 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialization Progress</span>
                      <span className="text-sm font-black italic text-blue-600">{Math.round(calculateProgress())}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2 shadow-inner">
                      <div
                        className="bg-blue-600 h-2 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-500"
                        style={{ width: `${calculateProgress()}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="p-10 space-y-12">
                    {homework.questions.map((question, index) => (
                      <div key={question.id} className="p-8 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex items-start justify-between mb-8">
                          <div className="flex items-center">
                            <span className="h-10 w-10 bg-slate-900 dark:bg-gray-700 text-white rounded-xl flex items-center justify-center font-black italic text-xs mr-4">
                              {index + 1 < 10 ? `0${index + 1}` : index + 1}
                            </span>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                              Query Specification
                            </h3>
                          </div>
                          <span className="text-[10px] font-black italic text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">{question.points} CREDITS</span>
                        </div>

                        <p className="text-lg font-bold text-slate-900 dark:text-white mb-10 leading-relaxed italic">{question.question_text}</p>

                        {/* Question Interaction Area */}
                        <div className="space-y-4">
                          {question.question_type === 'MULTIPLE_CHOICE' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {question.options?.map((option, optIndex) => (
                                <label key={optIndex} className={`flex items-center p-6 border rounded-[1.5rem] cursor-pointer transition-all group ${userAnswers[question.id.toString()] === option ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-blue-400'}`}>
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={option}
                                    checked={userAnswers[question.id.toString()] === option}
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    className="sr-only"
                                    disabled={!canSubmit}
                                  />
                                  <span className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center font-black italic text-xs mr-4 transition-colors">
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span className="font-bold text-sm">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {question.question_type === 'TRUE_FALSE' && (
                            <div className="grid grid-cols-2 gap-6">
                              {['True', 'False'].map((option) => (
                                <label key={option} className={`flex items-center p-8 border rounded-[2rem] cursor-pointer transition-all text-center justify-center group ${userAnswers[question.id.toString()] === option ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-slate-900'}`}>
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    value={option}
                                    checked={userAnswers[question.id.toString()] === option}
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    className="sr-only"
                                    disabled={!canSubmit}
                                  />
                                  <span className="font-black uppercase italic tracking-widest text-sm">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {question.question_type === 'TEXT' && (
                            <div className="relative">
                              <textarea
                                value={userAnswers[question.id.toString()] || ''}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                placeholder="INPUT SYSTEM RESPONSE..."
                                className="w-full px-8 py-6 bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                                rows={4}
                                disabled={!canSubmit}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* File Upload Section */}
                    <div className="p-8 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] border-2 border-dashed border-blue-200 dark:border-blue-900/30">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Supplementary Documentation</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-6">Attach mission reports or work documentation (Optional)</p>

                        <label className={`cursor-pointer px-8 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] transition-all ${selectedFile ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 text-blue-600 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm'}`}>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={!canSubmit}
                          />
                          {selectedFile ? 'File Attached: ' + selectedFile.name : 'Select Report File'}
                        </label>
                        {selectedFile && (
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="mt-4 text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-500"
                          >
                            Remove Attachment
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    {canSubmit && (
                      <div className="flex justify-end pt-10">
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting || Object.keys(userAnswers).length !== homework.questions.length}
                          className="px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase italic tracking-widest text-xs hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-blue-500/20 flex items-center"
                        >
                          {isSubmitting ? (
                            <>Syncing...</>
                          ) : (
                            <>
                              Deploy Submission
                              <Send className="ml-3 h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {isOverdue && !isSubmitted && (
                      <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border-2 border-dashed border-red-200 dark:border-red-900/30">
                        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-red-600 uppercase italic tracking-tight">Access Locked</h4>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-2 px-8">THE DEADLINE FOR THIS MODULE HAS PERISHED. CONTACT MISSION CONTROL FOR RESET.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Teacher View - Analytics and Submissions */}
          {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="border-b border-slate-50 dark:border-gray-700 bg-slate-50/50 dark:bg-slate-900/50">
                <nav className="flex space-x-12 px-10">
                  {[
                    { id: 'overview', label: 'Overview', icon: Eye },
                    { id: 'submissions', label: 'Submissions', icon: Users },
                    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-8 px-2 border-b-4 font-black uppercase italic tracking-widest text-[10px] transition-all ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                        }`}
                    >
                      <tab.icon className="h-4 w-4 mr-3" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-10">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-12">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-8">Executive Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Deployment Rate</span>
                          <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                            {Math.round((homework.homework_stats.submission_count / (homework.submissions?.length || 1)) * 100)}%
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Mastery Rating</p>
                          <p className={`text-3xl font-black italic tracking-tighter ${getSatScoreColor(homework.homework_stats.average_score)}`}>{homework.homework_stats.average_score}%</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Labor Average</p>
                          <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">
                            {Math.round(homework.homework_stats.average_time_spent / 60)}M
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic mb-6">Question List</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {homework.questions.map((question, index) => (
                          <div key={question.id} className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl hover:border-blue-400 transition-all group">
                            <div className="flex items-center">
                              <span className="h-8 w-8 bg-slate-900 dark:bg-slate-700 text-white rounded-xl flex items-center justify-center font-black italic text-[10px] mr-4">
                                {index + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-1 italic">"{question.question_text}"</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg ml-4 whitespace-nowrap">{question.points} CR</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                  <div className="space-y-8">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Personnel Submissions</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">TOTAL TRANSFERS: {homework.submissions.length}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-slate-100 dark:divide-gray-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                          <tr>
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operative</th>
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transmitted</th>
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Mastery Score</th>
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Labor Time</th>
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Control</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                          {homework.submissions.map(submission => (
                            <tr key={submission.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group">
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic text-xs mr-4">
                                    {submission.student.first_name[0]}{submission.student.last_name[0]}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                                      {submission.student.first_name} {submission.student.last_name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{submission.student.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap text-[10px] font-black uppercase text-slate-400 italic">
                                {formatDate(submission.submitted_at)}
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`text-lg font-black italic tracking-tighter ${getSatScoreColor(submission.score)}`}>{submission.score}</span>
                                  <span className="text-xs font-black text-slate-300 mx-2">/</span>
                                  <span className="text-sm font-black text-slate-400">{submission.max_score}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-widest">
                                {Math.round(submission.time_spent_seconds / 60)} MIN
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                {submission.is_late ? (
                                  <span className="px-4 py-2 text-[8px] font-black rounded-full uppercase tracking-widest bg-red-50 text-red-600 dark:bg-red-900/20">
                                    LATE
                                  </span>
                                ) : (
                                  <span className="px-4 py-2 text-[8px] font-black rounded-full uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                                    ON TIME
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <button
                                  onClick={() => handleGradeSubmission(submission)}
                                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase italic tracking-widest text-[9px] hover:scale-105 transition-all shadow-lg shadow-blue-500/20 flex items-center"
                                >
                                  <Edit className="h-3 w-3 mr-2" />
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-12">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Cohort Intelligence</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">REAL-TIME DATA HARVEST</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 transition-transform">
                          <BarChart3 className="h-48 w-48 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-black uppercase italic mb-10 tracking-tight flex items-center relative z-10">
                          <TrendingUp className="h-5 w-5 mr-3 text-blue-600" />
                          Mastery Spread
                        </h4>
                        <div className="space-y-6 relative z-10">
                          {[
                            { range: '90-100%', label: 'Master Elite', count: 0, color: 'bg-emerald-500' },
                            { range: '80-89%', label: 'Advanced', count: 1, color: 'bg-blue-500' },
                            { range: '70-79%', label: 'Proficient', count: 1, color: 'bg-amber-500' },
                            { range: 'Below 70%', label: 'Developing', count: 0, color: 'bg-red-500' },
                          ].map((tier) => (
                            <div key={tier.range} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>{tier.range} — {tier.label}</span>
                                <span>{tier.count} OPERATIVES</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className={`h-full ${tier.color} shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-1000`}
                                  style={{ width: tier.count > 0 ? '50%' : '0%' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 p-10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 -rotate-12 transition-transform">
                          <Trophy className="h-48 w-48 text-amber-500" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic mb-10 tracking-tight flex items-center relative z-10">
                          <Target className="h-5 w-5 mr-3 text-amber-500" />
                          Question Accuracy
                        </h4>
                        <div className="space-y-6 relative z-10">
                          {homework.questions.map((question, index) => (
                            <div key={question.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center">
                                <span className="text-xl font-black italic mr-5 text-slate-300">#{index + 1}</span>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest line-clamp-1 italic max-w-[150px]">"{question.question_text}"</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="h-1.5 w-16 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '80%' }} />
                                </div>
                                <span className="text-sm font-black italic text-blue-600 tracking-tighter">80%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          className="w-full mt-10 py-4 bg-slate-900 dark:bg-gray-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-600 transition-all flex items-center justify-center group"
                        >
                          Deep Scan Module <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showGradingModal && selectedSubmission && homework && (
          <GradingModal
            submission={selectedSubmission}
            questions={homework.questions}
            onClose={() => setShowGradingModal(false)}
            onSave={handleGradeSave}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
