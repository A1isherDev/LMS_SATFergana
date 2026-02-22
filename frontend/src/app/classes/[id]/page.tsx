'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  UserPlus,
  UserMinus,
  Award,
  Target,
  BarChart3,
  Trophy,
  Bell,
  Plus,
  Send,
  ArrowRight,
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, getSatScoreColor } from '@/utils/helpers';
import { classesApi } from '@/utils/api';
import StudentEnrollmentModal from '@/components/StudentEnrollmentModal';
import LeaderboardTable from '@/components/LeaderboardTable';
import { formatDistanceToNow } from 'date-fns';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  sat_score?: number;
  homework_completion_rate?: number;
  study_streak?: number;
}

interface Homework {
  id: number;
  title: string;
  description: string;
  due_date: string;
  total_questions: number;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  is_published: boolean;
  submission_count: number;
  average_score?: number;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  teacher_name: string;
  created_at: string;
}

interface ClassDetail {
  id: number;
  name: string;
  description: string;
  teacher: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  students: Student[];
  homework: Homework[];
  announcements: Announcement[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_students: number;
  created_at: string;
  class_stats: {
    average_sat_score: number;
    average_completion_rate: number;
    total_study_time: number;
    active_students: number;
  };
}

export default function ClassDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'homework' | 'analytics' | 'leaderboard'>('overview');
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        const data = await classesApi.getClass(parseInt(classId)) as ClassDetail;
        setClassDetail(data);
      } catch (error) {
        console.error('Error fetching class detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      fetchClassDetail();
    }
  }, [classId]);

  const handleEnrollStudent = () => {
    setShowEnrollmentModal(true);
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    const toastId = toast.loading('Removing student...');
    try {
      await classesApi.removeStudents(parseInt(classId), [studentId]);
      toast.success('Student removed successfully', { id: toastId });
      setClassDetail(prev => prev ? {
        ...prev,
        students: prev.students.filter(s => s.id !== studentId)
      } : null);
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Error removing student. Please try again.', { id: toastId });
    }
  };

  const handleEnrollSuccess = () => {
    window.location.reload();
  };

  const handleCreateHomework = () => {
    router.push(`/homework/create?class_id=${classId}`);
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Announcement title and content cannot be empty.');
      return;
    }

    setIsPostingAnnouncement(true);
    const toastId = toast.loading('Posting announcement...');
    try {
      await classesApi.postAnnouncement(parseInt(classId), newAnnouncement);
      toast.success('Announcement posted successfully', { id: toastId });
      setNewAnnouncement({ title: '', content: '' });
      setShowAnnouncementForm(false);

      // Refresh announcements
      const updatedClass = await classesApi.getClass(parseInt(classId)) as ClassDetail;
      setClassDetail(updatedClass);
    } catch (error) {
      console.error('Error posting announcement:', error);
      alert('Failed to post announcement');
    } finally {
      setIsPostingAnnouncement(false);
    }
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

  if (!classDetail) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Class Not Found</h2>
            <p className="text-gray-600 mb-4">The class you&apos;re looking for doesn&apos;t exist.</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start space-x-6">
              <button
                onClick={() => router.back()}
                className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all hover:scale-110"
                title="Back to Network"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Instructional Cohort</span>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{classDetail.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-2xl">{classDetail.description}</p>
              </div>
            </div>
            {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  className="flex items-center px-8 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase italic tracking-widest text-[9px] hover:scale-105 transition-all shadow-xl"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Broadcast
                </button>
                <button
                  onClick={handleEnrollStudent}
                  className="flex items-center px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase italic tracking-widest text-[9px] hover:scale-105 transition-all shadow-xl"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enrollment
                </button>
                <button
                  onClick={handleCreateHomework}
                  className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase italic tracking-widest text-[9px] hover:scale-105 transition-all shadow-xl"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  New Task
                </button>
              </div>
            )}
          </div>

          {/* New Announcement Form (Conditionally Rendered) */}
          {showAnnouncementForm && (user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-blue-100 dark:border-gray-700 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center">
                    <Bell className="h-6 w-6 mr-3 text-blue-600" />
                    Channel Broadcast
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Disseminate critical information to the cohort</p>
                </div>
                <button onClick={() => setShowAnnouncementForm(false)} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-slate-900">
                  <Plus className="h-6 w-6 rotate-45" />
                </button>
              </div>
              <form onSubmit={handlePostAnnouncement} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Subject Heading</label>
                  <input
                    type="text"
                    required
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-900 dark:text-white"
                    placeholder="Brief objective..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Message Specification</label>
                  <textarea
                    required
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-900 dark:text-white"
                    placeholder="Enter comprehensive announcement details..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPostingAnnouncement}
                    className="flex items-center px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase italic tracking-widest text-xs hover:scale-105 disabled:opacity-50 transition-all shadow-2xl shadow-blue-500/20"
                  >
                    {isPostingAnnouncement ? 'Syncing...' : (
                      <>
                        <Send className="h-4 w-4 mr-3" />
                        Execute Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Class Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-blue-400 transition-all">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Active Peers</p>
                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">{classDetail.students.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-emerald-400 transition-all">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Tasks Assigned</p>
                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">{classDetail.homework.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-purple-400 transition-all">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Mastery Avg</p>
                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">{classDetail.class_stats.average_sat_score}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 p-8 flex items-center group hover:border-orange-400 transition-all">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-3xl mr-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Velocity</p>
                <p className="text-3xl font-black italic text-slate-900 dark:text-white tracking-tighter">{classDetail.class_stats.average_completion_rate}%</p>
              </div>
            </div>
          </div>

          {/* Tabs Nav */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
            <div className="border-b border-slate-50 dark:border-gray-700 overflow-x-auto">
              <nav className="flex whitespace-nowrap px-8">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'homework', label: 'Homework', icon: BookOpen },
                  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'students' | 'homework' | 'leaderboard' | 'analytics')}
                    className={`flex items-center py-6 px-10 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/20 italic'
                      : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <tab.icon className={`h-4 w-4 mr-3 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-300'}`} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Overview Tab with Announcements Integrated */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                    {/* Announcements Section */}
                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center">
                          <Bell className="h-5 w-5 mr-3 text-blue-600" />
                          Bulletin Protocol
                        </h3>
                      </div>
                      <div className="space-y-6">
                        {classDetail.announcements && classDetail.announcements.length > 0 ? (
                          classDetail.announcements.map((announcement) => (
                            <div key={announcement.id} className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-400 transition-all group">
                              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic mb-4 leading-tight">{announcement.title}</h4>
                              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 whitespace-pre-wrap leading-relaxed">
                                {announcement.content}
                              </p>
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-2 text-blue-500" />
                                  AUTHOR: {announcement.teacher_name}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2 text-slate-300" />
                                  RELEASED {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Bell className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-wider">Zero announcements detected in this sector.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    {/* Class Context Info */}
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 group-hover:rotate-6 transition-transform">
                        <Award className="h-32 w-32" />
                      </div>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 flex items-center relative z-10">
                        <Calendar className="mr-3 h-5 w-5 text-blue-400" />
                        Cohort Specs
                      </h3>
                      <div className="space-y-6 relative z-10">
                        <div>
                          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Primary Instructor</p>
                          <p className="font-black italic text-lg uppercase tracking-tight">{classDetail.teacher.first_name} {classDetail.teacher.last_name}</p>
                          <p className="text-blue-400 text-[10px] font-bold mt-1">{classDetail.teacher.email}</p>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Operation Window</p>
                          <p className="font-black italic text-sm uppercase tracking-tight">
                            {formatDate(classDetail.start_date)} <span className="text-blue-500">→</span> {formatDate(classDetail.end_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 shadow-xl group hover:border-blue-400 transition-all">
                      <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 flex items-center text-slate-900 dark:text-white">
                        <TrendingUp className="mr-3 h-5 w-5 text-blue-600" />
                        Metric Summary
                      </h3>
                      <ul className="space-y-6">
                        <li className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mastery Index</span>
                          <span className={`text-xl font-black italic tracking-tighter ${getSatScoreColor(classDetail.class_stats.average_sat_score)}`}>{classDetail.class_stats.average_sat_score}</span>
                        </li>
                        <li className="flex justify-between items-end pb-6 border-b border-slate-50 dark:border-gray-700">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Labor Time</span>
                          <span className="text-xl font-black italic text-slate-900 dark:text-white tracking-tighter">{Math.round(classDetail.class_stats.total_study_time / 60)}H</span>
                        </li>
                        <li className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilization</span>
                          <span className="text-xl font-black italic text-blue-600 tracking-tighter">{classDetail.students.length}/{classDetail.max_students}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="space-y-8">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Enrolled Personnel</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">TOTAL STRENGTH: {classDetail.students.length} OPERATIVES</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-slate-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-gray-700">
                      <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Individual Student</th>
                          <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Composite Score</th>
                          <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Task Completion</th>
                          <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Dedication Streak</th>
                          {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Control</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                        {classDetail.students.map(student => (
                          <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group">
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black italic text-xs mr-4">
                                  {student.first_name[0]}{student.last_name[0]}
                                </div>
                                <div>
                                  {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') ? (
                                    <Link
                                      href={`/classes/${classId}/students/${student.id}`}
                                      className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight hover:text-blue-600 transition-colors"
                                    >
                                      {student.first_name} {student.last_name}
                                    </Link>
                                  ) : (
                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                                      {student.first_name} {student.last_name}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <Award className={`h-4 w-4 mr-2 ${getSatScoreColor(student.sat_score || 0)}`} />
                                <span className={`text-lg font-black italic tracking-tighter ${getSatScoreColor(student.sat_score || 0)}`}>{student.sat_score || '---'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center w-full max-w-[120px]">
                                <div className="flex-1 bg-slate-100 dark:bg-gray-700 rounded-full h-1.5 mr-4 shadow-inner">
                                  <div
                                    className="bg-emerald-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                                    style={{ width: `${student.homework_completion_rate || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-black italic text-slate-900 dark:text-white">{student.homework_completion_rate || 0}%</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <Target className="h-4 w-4 text-orange-500 mr-2" />
                                <span className="text-xs font-black italic text-slate-900 dark:text-white">{student.study_streak || 0} DAYS</span>
                              </div>
                            </td>
                            {(user?.role === 'MAIN_TEACHER' || user?.role === 'SUPPORT_TEACHER') && (
                              <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleRemoveStudent(student.id)}
                                  className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Homework Tab */}
              {activeTab === 'homework' && (
                <div className="space-y-10">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Academic Directives</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MODULES DEPLOYED: {classDetail.homework.length}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {classDetail.homework.map(hw => (
                      <div key={hw.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 p-8 shadow-sm hover:border-blue-400 transition-all group relative overflow-hidden">
                        {hw.difficulty_level === 'HARD' && (
                          <div className="absolute top-0 right-0 w-2 h-full bg-red-500 opacity-50" />
                        )}
                        <div className="flex items-start justify-between mb-8">
                          <div className="p-4 bg-slate-900 dark:bg-gray-700 rounded-3xl text-white group-hover:bg-blue-600 transition-colors">
                            <BookOpen className="h-6 w-6" />
                          </div>
                          <span className={`px-4 py-2 text-[8px] font-black rounded-full uppercase tracking-widest ${hw.difficulty_level === 'EASY' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                            hw.difficulty_level === 'MEDIUM' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                              'bg-red-50 text-red-600 dark:bg-red-900/20'
                            }`}>
                            {hw.difficulty_level} THREAT
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic mb-2 tracking-tight">{hw.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-8 italic">"{hw.description}"</p>

                        <div className="space-y-4 mb-8">
                          <div className="flex items-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                            <Calendar className="h-4 w-4 mr-3 text-blue-500" />
                            DUE PROTOCOL: {formatDate(hw.due_date)}
                          </div>
                          <div className="flex items-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                            <Target className="h-4 w-4 mr-3 text-orange-500" />
                            {hw.total_questions} QUERIES IDENTIFIED
                          </div>
                          <div className="flex items-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                            <Users className="h-4 w-4 mr-3 text-purple-500" />
                            UTILIZATION: {hw.submission_count}/{classDetail.students.length} SUBMITTED
                          </div>
                        </div>

                        {hw.average_score && (
                          <div className="pt-6 border-t border-slate-50 dark:border-gray-700 flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery Rating</span>
                            <span className={`text-2xl font-black italic tracking-tighter ${getSatScoreColor(hw.average_score)}`}>{hw.average_score}%</span>
                          </div>
                        )}

                        <button className="w-full mt-8 py-4 bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                          Inspect Analytics
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-10">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Cohort Intelligence</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">REAL-TIME PERFORMANCE TELEMETRY</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 p-10 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 transition-transform">
                        <BarChart3 className="h-48 w-48 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic mb-10 tracking-tight flex items-center relative z-10">
                        <TrendingUp className="h-5 w-5 mr-3 text-blue-600" />
                        Operation Metrics
                      </h4>
                      <div className="space-y-8 relative z-10">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery Index</span>
                          <span className={`text-2xl font-black italic tracking-tighter ${getSatScoreColor(classDetail.class_stats.average_sat_score)}`}>{classDetail.class_stats.average_sat_score}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Saturation</span>
                          <span className="text-2xl font-black italic text-emerald-500 tracking-tighter">{classDetail.class_stats.average_completion_rate}%</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Labor Capacity</span>
                          <span className="text-2xl font-black italic text-slate-900 dark:text-white tracking-tighter">{Math.round(classDetail.class_stats.total_study_time / 60)}H</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Operatives</span>
                          <span className="text-2xl font-black italic text-blue-600 tracking-tighter">{classDetail.class_stats.active_students}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-slate-100 dark:border-gray-700 p-10 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 -rotate-12 transition-transform">
                        <Trophy className="h-48 w-48 text-amber-500" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic mb-10 tracking-tight flex items-center relative z-10">
                        <Trophy className="h-5 w-5 mr-3 text-amber-500" />
                        Elite Operatives
                      </h4>
                      <div className="space-y-8 relative z-10">
                        {classDetail.students
                          .sort((a, b) => (b.sat_score || 0) - (a.sat_score || 0))
                          .slice(0, 3)
                          .map((student, index) => (
                            <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center">
                                <span className={`text-xl font-black italic mr-5 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-amber-700'}`}>0{index + 1}</span>
                                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black italic text-[10px] mr-4 shadow-lg shadow-blue-500/20">
                                  {student.first_name[0]}{student.last_name[0]}
                                </div>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{student.first_name} {student.last_name}</span>
                              </div>
                              <span className={`text-xl font-black italic tracking-tighter ${getSatScoreColor(student.sat_score || 0)}`}>{student.sat_score || '---'}</span>
                            </div>
                          ))}
                      </div>
                      <button
                        onClick={() => setActiveTab('leaderboard')}
                        className="w-full mt-10 py-4 bg-slate-900 dark:bg-gray-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-blue-600 transition-all flex items-center justify-center group"
                      >
                        View Full Leaderboard <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Tab */}
              {activeTab === 'leaderboard' && (
                <LeaderboardTable classId={parseInt(classId)} />
              )}
            </div>
          </div>
        </div>

        {showEnrollmentModal && classDetail && (
          <StudentEnrollmentModal
            classId={classDetail.id}
            currentStudents={classDetail.students}
            onClose={() => setShowEnrollmentModal(false)}
            onEnroll={handleEnrollSuccess}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
