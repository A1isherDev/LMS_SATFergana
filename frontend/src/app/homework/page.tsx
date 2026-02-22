'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Filter,
  Search,
  Plus,
  FileText,
  TrendingUp,
  Star,
  Download,
  ArrowRight,
  ChevronRight,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime, getDifficultyColor } from '../../utils/helpers';
import { homeworkApi } from '../../utils/api';

interface Homework {
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
  };
  due_date: string;
  is_published: boolean;
  max_score: number;
  total_questions: number;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  created_at: string;
  submission?: {
    id: number;
    submitted_at: string;
    score: number;
    max_score: number;
    accuracy_percentage?: number;
    is_late: boolean;
  };
}

function HomeworkContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'overdue'>(
    (filterParam as any) || 'all'
  );

  const handleCreateAssignment = () => {
    router.push('/homework/create');
  };

  const handleViewHomework = (homeworkId: number) => {
    router.push(`/homework/${homeworkId}`);
  };

  const handleExportGrades = async () => {
    try {
      const response = await homeworkApi.exportGrades() as any;
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grades_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting grades:', error);
    }
  };

  useEffect(() => {
    const fetchHomeworkData = async () => {
      try {
        let response;
        if (user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') {
          response = await homeworkApi.getHomework() as any;
        } else {
          response = await homeworkApi.getStudentHomework() as any;
        }
        setHomework(response.results || response);
      } catch (error) {
        setHomework([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchHomeworkData();
    else setIsLoading(false);
  }, [user]);

  const getHomeworkStatus = (hw: Homework) => {
    if (hw.submission) return hw.submission.is_late ? 'late' : 'submitted';
    const now = new Date();
    const dueDate = new Date(hw.due_date);
    return now > dueDate ? 'overdue' : 'pending';
  };

  const filteredHomework = homework.filter(hw => {
    const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.class_obj.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    const status = getHomeworkStatus(hw);
    return matchesSearch && status === filterStatus;
  });

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-48"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-[2.5rem]"></div>
              ))}
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
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Curriculum</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Study Assignments</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mt-2">Track your progress across specialized modules and complete assigned tasks.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportGrades}
                className="p-4 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl hover:scale-105 transition-all text-slate-400 hover:text-blue-600 shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
                <button
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center"
                  onClick={handleCreateAssignment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Assignment
                </button>
              )}
            </div>
          </div>

          {/* Search and Filter - Premium Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              {['all', 'pending', 'submitted', 'overdue'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Homework List */}
          <div className="grid grid-cols-1 gap-6">
            {filteredHomework.map((hw) => {
              const status = getHomeworkStatus(hw);
              return (
                <div key={hw.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 group hover:border-blue-400 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="h-24 w-24 text-slate-900 dark:text-white" />
                  </div>

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider ${getDifficultyColor(hw.difficulty_level)}`}>
                          {hw.difficulty_level}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{hw.class_obj.name}</span>
                      </div>

                      <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 leading-none group-hover:text-blue-600 transition-colors">{hw.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl line-clamp-2 mb-6">{hw.description}</p>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          <Target className="h-4 w-4 text-slate-300" />
                          {hw.total_questions} Questions
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          <Calendar className="h-4 w-4 text-slate-300" />
                          DUE {formatDate(hw.due_date)}
                        </div>
                        {hw.submission && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                            <CheckCircle className="h-4 w-4" />
                            SCORE: {hw.submission.score}/{hw.submission.max_score}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
                        <button
                          className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-white transition-all text-slate-400 hover:text-blue-600"
                          onClick={() => router.push(`/analytics?homework_id=${hw.id}`)}
                        >
                          <TrendingUp className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewHomework(hw.id)}
                        className={`px-8 py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all flex items-center justify-center group/btn ${hw.submission
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-white'
                          : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/10'
                          }`}
                      >
                        {hw.submission ? 'Review Session' : 'Initiate Module'}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredHomework.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">No Records Found</h3>
              <p className="text-slate-400 font-medium italic">Adjust your filters or contact your coordinator.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function HomeworkPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    }>
      <HomeworkContent />
    </Suspense>
  );
}
