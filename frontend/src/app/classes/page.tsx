'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '../../components/AuthGuard';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Users,
  Award,
  BookOpen,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, getSatScoreColor } from '../../utils/helpers';
import { classesApi } from '../../utils/api';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Class {
  id: number;
  name: string;
  description: string;
  teacher: Teacher;
  students: Student[];
  is_active: boolean;
  created_at: string;
  homework_count: number;
  upcoming_homework: number;
  average_score: number;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateClass = () => {
    router.push('/classes/create');
  };

  const handleViewClass = (classId: number) => {
    router.push(`/classes/${classId}`);
  };

  const handleClassAnalytics = (classId: number) => {
    router.push(`/analytics?class_id=${classId}`);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') {
          const response = await classesApi.getClasses() as unknown as { results: Class[] } | Class[];
          setClasses('results' in response ? response.results : response);
        } else if (user?.role === 'STUDENT') {
          const response = await classesApi.getStudentClasses() as unknown as { results: Class[] } | Class[];
          setClasses('results' in response ? response.results : response);
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
        setClasses([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchClasses();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-[2.5rem]"></div>
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
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Educational Network</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Academic Classes</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') ? 'Manage your instructional cohorts and student performance' : 'Access your registered instructional sessions'}
              </p>
            </div>
            {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
              <button
                onClick={handleCreateClass}
                className="flex items-center px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Establish Cohort
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
              <input
                type="text"
                placeholder="Search cohorts or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-white dark:bg-gray-800 border-none rounded-[1.5rem] shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white"
              />
            </div>
            <button className="flex items-center px-8 py-5 bg-white dark:bg-gray-800 border-none rounded-[1.5rem] shadow-sm hover:bg-slate-50 transition-all text-slate-400 group">
              <Filter className="h-4 w-4 mr-2 group-hover:text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-slate-900">Advanced Filter</span>
            </button>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden hover:border-blue-400 transition-all group active:scale-[0.98]">
                <div className="p-8 pb-4">
                  <div className="flex items-start justify-between mb-8">
                    <div className="p-4 bg-slate-900 dark:bg-blue-600 rounded-3xl text-white shadow-xl">
                      <Users className="h-6 w-6" />
                    </div>
                    <span className={`px-4 py-2 text-[8px] font-black rounded-full uppercase tracking-[0.1em] ${cls.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400 dark:bg-gray-700'
                      }`}>
                      {cls.is_active ? 'Online' : 'Hibernated'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 leading-tight group-hover:text-blue-600 transition-colors">{cls.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Instructor: {cls.teacher.first_name} {cls.teacher.last_name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 font-medium italic">"{cls.description}"</p>

                  <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-50 dark:border-gray-700/50">
                    <div className="text-center">
                      <p className="text-xl font-black text-slate-900 dark:text-white italic">{cls.students.length}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Peers</p>
                    </div>
                    <div className="text-center border-x border-slate-50 dark:border-gray-700/50">
                      <p className="text-xl font-black text-slate-900 dark:text-white italic">{cls.homework_count}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xl font-black italic ${getSatScoreColor(cls.average_score)}`}>{cls.average_score || '--'}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rating</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 pt-4 flex gap-4">
                  <button
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                    onClick={() => handleViewClass(cls.id)}
                  >
                    Open Console
                  </button>
                  {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
                    <button
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      onClick={() => handleClassAnalytics(cls.id)}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredClasses.length === 0 && (
            <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-[3rem] border border-dashed border-slate-200 dark:border-gray-700">
              <div className="h-20 w-20 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-8 shadow-inner">
                <BookOpen className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No Active Cohorts</h3>
              <p className="text-slate-400 font-medium uppercase text-[10px] tracking-[0.2em] mb-10">
                {searchTerm ? 'Adjust filter parameters for wider search' : 'Initiate a new instructional cycle'}
              </p>
              {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && !searchTerm && (
                <button
                  onClick={handleCreateClass}
                  className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all shadow-2xl shadow-blue-500/20"
                >
                  Create Your First Class
                </button>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
