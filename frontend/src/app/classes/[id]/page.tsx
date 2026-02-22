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
  Send
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/helpers';
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
    if (!confirm('Are you sure you want to remove this student from the class?')) return;
    try {
      await classesApi.removeStudents(parseInt(classId), [studentId]);
      if (classDetail) {
        setClassDetail({
          ...classDetail,
          students: classDetail.students.filter(s => s.id !== studentId)
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student. Please try again.');
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
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    setIsPostingAnnouncement(true);
    try {
      const response = await classesApi.postAnnouncement(parseInt(classId), newAnnouncement);
      alert('Announcement posted successfully');
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                title="Back to Classes"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classDetail.name}</h1>
                <p className="text-gray-600 text-sm line-clamp-1">{classDetail.description}</p>
              </div>
            </div>
            {user?.role === 'TEACHER' && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  New Announcement
                </button>
                <button
                  onClick={handleEnrollStudent}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Student
                </button>
                <button
                  onClick={handleCreateHomework}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Assign Homework
                </button>
              </div>
            )}
          </div>

          {/* New Announcement Form (Conditionally Rendered) */}
          {showAnnouncementForm && user?.role === 'TEACHER' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-amber-500" />
                  Post New Announcement
                </h3>
                <button onClick={() => setShowAnnouncementForm(false)} className="text-gray-400 hover:text-gray-600">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>
              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    placeholder="e.g., Exam Date Changed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                  <textarea
                    required
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                    placeholder="Type your message to the class here..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPostingAnnouncement}
                    className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors font-semibold"
                  >
                    {isPostingAnnouncement ? 'Posting...' : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Announcement
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Class Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Students</p>
                <p className="text-xl font-black text-gray-900">{classDetail.students.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-3 bg-green-50 rounded-xl mr-4">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Homework</p>
                <p className="text-xl font-black text-gray-900">{classDetail.homework.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-3 bg-purple-50 rounded-xl mr-4">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Avg SAT</p>
                <p className="text-xl font-black text-gray-900">{classDetail.class_stats.average_sat_score}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="p-3 bg-orange-50 rounded-xl mr-4">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Completion</p>
                <p className="text-xl font-black text-gray-900">{classDetail.class_stats.average_completion_rate}%</p>
              </div>
            </div>
          </div>

          {/* Tabs Nav */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 overflow-x-auto">
              <nav className="flex whitespace-nowrap px-4">
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
                    className={`flex items-center py-5 px-6 font-bold text-sm transition-all border-b-2 ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-8">
              {/* Overview Tab with Announcements Integrated */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Announcements Section */}
                    <section>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <Bell className="h-5 w-5 mr-3 text-blue-600" />
                        Class Announcements
                      </h3>
                      <div className="space-y-4">
                        {classDetail.announcements && classDetail.announcements.length > 0 ? (
                          classDetail.announcements.map((announcement) => (
                            <div key={announcement.id} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all">
                              <h4 className="font-bold text-gray-900 mb-2">{announcement.title}</h4>
                              <p className="text-gray-600 text-sm mb-4 line-clamp-3 md:line-clamp-none whitespace-pre-wrap">
                                {announcement.content}
                              </p>
                              <div className="flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-50 pt-4">
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  By {announcement.teacher_name}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium italic">No announcements yet for this class.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    {/* Class Context Info */}
                    <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Calendar className="mr-2 h-5 w-5 text-blue-400" />
                        Course Info
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Primary Teacher</p>
                          <p className="font-medium">{classDetail.teacher.first_name} {classDetail.teacher.last_name}</p>
                          <p className="text-slate-500 text-xs">{classDetail.teacher.email}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-800">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Term Duration</p>
                          <p className="font-medium">{formatDate(classDetail.start_date)} — {formatDate(classDetail.end_date)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-blue-600 rounded-2xl text-white shadow-xl">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-blue-200" />
                        Class Summary
                      </h3>
                      <ul className="space-y-3 text-sm">
                        <li className="flex justify-between">
                          <span className="text-blue-100">Average SAT</span>
                          <span className="font-black">{classDetail.class_stats.average_sat_score}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-blue-100">Study Time</span>
                          <span className="font-black">{Math.round(classDetail.class_stats.total_study_time / 60)}h</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-blue-100">Enrollment</span>
                          <span className="font-black">{classDetail.students.length}/{classDetail.max_students}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Enrolled Students ({classDetail.students.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SAT Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Streak</th>
                          {user?.role === 'TEACHER' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {classDetail.students.map(student => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                {user?.role === 'TEACHER' ? (
                                  <Link
                                    href={`/classes/${classId}/students/${student.id}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {student.first_name} {student.last_name}
                                  </Link>
                                ) : (
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                )}
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Award className="h-4 w-4 text-yellow-500 mr-2" />
                                <span className="text-sm text-gray-900">{student.sat_score || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${student.homework_completion_rate || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-900">{student.homework_completion_rate || 0}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Target className="h-4 w-4 text-orange-500 mr-2" />
                                <span className="text-sm text-gray-900">{student.study_streak || 0} days</span>
                              </div>
                            </td>
                            {user?.role === 'TEACHER' && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleRemoveStudent(student.id)}
                                  className="text-red-600 hover:text-red-900"
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Homework Assignments ({classDetail.homework.length})</h3>
                  <div className="space-y-4">
                    {classDetail.homework.map(hw => (
                      <div key={hw.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{hw.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{hw.description}</p>
                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due {formatDate(hw.due_date)}
                              </div>
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {hw.total_questions} questions
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {hw.submission_count}/{classDetail.students.length} submitted
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${hw.difficulty_level === 'EASY' ? 'bg-green-100 text-green-800' :
                              hw.difficulty_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {hw.difficulty_level}
                            </span>
                          </div>
                        </div>
                        {hw.average_score && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Average Score</span>
                              <span className="font-medium">{hw.average_score}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Class Analytics</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Performance Overview</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average SAT Score</span>
                          <span className="font-medium">{classDetail.class_stats.average_sat_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Homework Completion</span>
                          <span className="font-medium">{classDetail.class_stats.average_completion_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Study Time</span>
                          <span className="font-medium">{Math.round(classDetail.class_stats.total_study_time / 60)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Active Students</span>
                          <span className="font-medium">{classDetail.class_stats.active_students}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Top Performers</h4>
                      <div className="space-y-3">
                        {classDetail.students
                          .sort((a, b) => (b.sat_score || 0) - (a.sat_score || 0))
                          .slice(0, 3)
                          .map((student, index) => (
                            <div key={student.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-lg font-bold text-gray-400 mr-3">#{index + 1}</span>
                                <span className="text-sm font-medium">{student.first_name} {student.last_name}</span>
                              </div>
                              <span className="text-sm font-medium">{student.sat_score || 'N/A'}</span>
                            </div>
                          ))}
                      </div>
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
