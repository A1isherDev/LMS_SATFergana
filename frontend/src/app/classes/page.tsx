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
import { formatDate } from '../../utils/helpers';
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

  const handleFilter = () => {
    // TODO: Implement advanced filtering
    console.log('Filter clicked - implement advanced filters');
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (user?.role === 'TEACHER') {
          const response = await classesApi.getClasses() as unknown as { results: Class[] } | Class[];
          setClasses('results' in response ? response.results : response);
        } else if (user?.role === 'STUDENT') {
          const response = await classesApi.getStudentClasses() as unknown as { results: Class[] } | Class[];
          setClasses('results' in response ? response.results : response);
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error);
        // Set empty array on error
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
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
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

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
              <p className="text-gray-600">
                {user?.role === 'TEACHER' ? 'Manage your classes and students' : 'View your enrolled classes'}
              </p>
            </div>
            {user?.role === 'TEACHER' && (
              <button
                onClick={handleCreateClass}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={handleFilter}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Class Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{cls.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{cls.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {cls.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center mb-4">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {cls.teacher.first_name} {cls.teacher.last_name}
                      </p>
                      <p className="text-xs text-gray-500">Instructor</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">{cls.students.length}</span>
                      </div>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BookOpen className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">{cls.homework_count}</span>
                      </div>
                      <p className="text-xs text-gray-500">Homework</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Award className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">{cls.average_score}</span>
                      </div>
                      <p className="text-xs text-gray-500">Avg Score</p>
                    </div>
                  </div>

                  {/* Upcoming Homework */}
                  {cls.upcoming_homework > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                          {cls.upcoming_homework} upcoming assignment{cls.upcoming_homework > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => handleViewClass(cls.id)}
                    >
                      View Class
                    </button>
                    {user?.role === 'TEACHER' && (
                      <button
                        className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => handleClassAnalytics(cls.id)}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {formatDate(cls.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredClasses.length === 0 && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first class'}
              </p>
              {user?.role === 'TEACHER' && !searchTerm && (
                <button
                  onClick={handleCreateClass}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Class
                </button>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
