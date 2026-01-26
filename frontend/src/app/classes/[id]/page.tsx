'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  Mail,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime } from '@/utils/helpers';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'homework' | 'analytics'>('overview');

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        const response = await fetch(`/api/classes/${classId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setClassDetail(data);
        } else {
          // Fallback to mock data
          const mockData: ClassDetail = getMockClassDetail();
          setClassDetail(mockData);
        }
      } catch (error) {
        console.error('Error fetching class detail:', error);
        const mockData: ClassDetail = getMockClassDetail();
        setClassDetail(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      fetchClassDetail();
    }
  }, [classId]);

  const getMockClassDetail = (): ClassDetail => ({
    id: parseInt(classId),
    name: 'SAT Math - Advanced',
    description: 'Advanced mathematics preparation for SAT with focus on algebra, geometry, and data analysis. This course covers all topics tested in the SAT math section.',
    teacher: {
      id: 1,
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@satfergana.com'
    },
    students: [
      {
        id: 2,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        sat_score: 1250,
        homework_completion_rate: 85,
        study_streak: 12
      },
      {
        id: 3,
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob@example.com',
        sat_score: 1180,
        homework_completion_rate: 92,
        study_streak: 8
      },
      {
        id: 4,
        first_name: 'Carol',
        last_name: 'Davis',
        email: 'carol@example.com',
        sat_score: 1320,
        homework_completion_rate: 78,
        study_streak: 15
      }
    ],
    homework: [
      {
        id: 1,
        title: 'Algebra Practice Set #5',
        description: 'Complete exercises on quadratic equations and factoring',
        due_date: '2025-02-05T23:59:59Z',
        total_questions: 25,
        difficulty_level: 'MEDIUM',
        is_published: true,
        submission_count: 2,
        average_score: 88
      },
      {
        id: 2,
        title: 'Geometry Review',
        description: 'Review triangles, circles, and coordinate geometry',
        due_date: '2025-02-10T23:59:59Z',
        total_questions: 30,
        difficulty_level: 'EASY',
        is_published: true,
        submission_count: 1,
        average_score: 92
      }
    ],
    start_date: '2025-01-15',
    end_date: '2025-05-15',
    is_active: true,
    max_students: 30,
    created_at: '2025-01-10T10:00:00Z',
    class_stats: {
      average_sat_score: 1250,
      average_completion_rate: 85,
      total_study_time: 2450, // minutes
      active_students: 3
    }
  });

  const handleEnrollStudent = () => {
    // TODO: Implement student enrollment
    alert('Student enrollment feature coming soon!');
  };

  const handleRemoveStudent = (studentId: number) => {
    // TODO: Implement student removal
    alert('Remove student feature coming soon!');
  };

  const handleCreateHomework = () => {
    router.push(`/homework/create?class_id=${classId}`);
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
            <p className="text-gray-600 mb-4">The class you're looking for doesn't exist.</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Classes
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classDetail.name}</h1>
                <p className="text-gray-600">{classDetail.description}</p>
              </div>
            </div>
            {user?.role === 'TEACHER' && (
              <div className="flex space-x-2">
                <button
                  onClick={handleEnrollStudent}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Student
                </button>
                <button
                  onClick={handleCreateHomework}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Homework
                </button>
              </div>
            )}
          </div>

          {/* Class Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{classDetail.students.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Homework</p>
                  <p className="text-2xl font-bold text-gray-900">{classDetail.homework.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Avg SAT Score</p>
                  <p className="text-2xl font-bold text-gray-900">{classDetail.class_stats.average_sat_score}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{classDetail.class_stats.average_completion_rate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'students', label: 'Students', icon: Users },
                  { id: 'homework', label: 'Homework', icon: BookOpen },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Teacher</p>
                        <p className="font-medium">{classDetail.teacher.first_name} {classDetail.teacher.last_name}</p>
                        <p className="text-sm text-gray-500">{classDetail.teacher.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Schedule</p>
                        <p className="font-medium">{formatDate(classDetail.start_date)} - {formatDate(classDetail.end_date)}</p>
                        <p className="text-sm text-gray-500">Max {classDetail.max_students} students</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-blue-600 mr-3" />
                          <div>
                            <p className="font-medium">Algebra Practice Set #5 assigned</p>
                            <p className="text-sm text-gray-500">2 days ago</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">2/3 submitted</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium">New student enrolled</p>
                            <p className="text-sm text-gray-500">1 week ago</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">Carol Davis</span>
                      </div>
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
                                <div className="text-sm font-medium text-gray-900">
                                  {student.first_name} {student.last_name}
                                </div>
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
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              hw.difficulty_level === 'EASY' ? 'bg-green-100 text-green-800' :
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
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
