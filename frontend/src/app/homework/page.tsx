'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
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
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, getDifficultyColor } from '@/utils/helpers';

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
  total_questions: number;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  created_at: string;
  submission?: {
    id: number;
    submitted_at: string;
    score: number;
    max_score: number;
    is_late: boolean;
  };
}

export default function HomeworkPage() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');

  useEffect(() => {
    // TODO: Fetch actual homework from API
    const mockHomework: Homework[] = user?.role === 'TEACHER' ? [
      {
        id: 1,
        title: 'Algebra Practice Set #5',
        description: 'Complete exercises on quadratic equations and factoring',
        class_obj: { id: 1, name: 'SAT Math - Advanced' },
        assigned_by: { id: 1, first_name: 'John', last_name: 'Smith' },
        due_date: '2024-01-30T23:59:59Z',
        is_published: true,
        total_questions: 25,
        difficulty_level: 'MEDIUM',
        created_at: '2024-01-20T10:00:00Z'
      },
      {
        id: 2,
        title: 'Reading Comprehension Test',
        description: 'Analyze passages and answer comprehension questions',
        class_obj: { id: 2, name: 'SAT Reading & Writing' },
        assigned_by: { id: 1, first_name: 'John', last_name: 'Smith' },
        due_date: '2024-02-05T23:59:59Z',
        is_published: true,
        total_questions: 20,
        difficulty_level: 'HARD',
        created_at: '2024-01-22T14:30:00Z'
      }
    ] : [
      {
        id: 1,
        title: 'Algebra Practice Set #5',
        description: 'Complete exercises on quadratic equations and factoring',
        class_obj: { id: 1, name: 'SAT Math - Advanced' },
        assigned_by: { id: 1, first_name: 'John', last_name: 'Smith' },
        due_date: '2024-01-30T23:59:59Z',
        is_published: true,
        total_questions: 25,
        difficulty_level: 'MEDIUM',
        created_at: '2024-01-20T10:00:00Z',
        submission: {
          id: 1,
          submitted_at: '2024-01-25T15:30:00Z',
          score: 22,
          max_score: 25,
          is_late: false
        }
      },
      {
        id: 2,
        title: 'Reading Comprehension Test',
        description: 'Analyze passages and answer comprehension questions',
        class_obj: { id: 2, name: 'SAT Reading & Writing' },
        assigned_by: { id: 1, first_name: 'John', last_name: 'Smith' },
        due_date: '2024-02-05T23:59:59Z',
        is_published: true,
        total_questions: 20,
        difficulty_level: 'HARD',
        created_at: '2024-01-22T14:30:00Z'
      },
      {
        id: 3,
        title: 'Geometry Review',
        description: 'Review triangles, circles, and coordinate geometry',
        class_obj: { id: 1, name: 'SAT Math - Advanced' },
        assigned_by: { id: 1, first_name: 'John', last_name: 'Smith' },
        due_date: '2024-01-20T23:59:59Z',
        is_published: true,
        total_questions: 15,
        difficulty_level: 'EASY',
        created_at: '2024-01-15T10:00:00Z'
      }
    ];

    setTimeout(() => {
      setHomework(mockHomework);
      setIsLoading(false);
    }, 1000);
  }, [user]);

  const getHomeworkStatus = (hw: Homework) => {
    if (hw.submission) {
      return hw.submission.is_late ? 'late' : 'submitted';
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="animate-pulse">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
              <p className="text-gray-600">
                {user?.role === 'TEACHER' ? 'Manage assignments and track student progress' : 'View and complete your assignments'}
              </p>
            </div>
            {user?.role === 'TEACHER' && (
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search homework..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Homework List */}
          <div className="space-y-4">
            {filteredHomework.map((hw) => {
              const status = getHomeworkStatus(hw);
              return (
                <div key={hw.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">{hw.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(hw.difficulty_level)}`}>
                            {hw.difficulty_level}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{hw.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {hw.class_obj.name}
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {hw.total_questions} questions
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due {formatDate(hw.due_date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStatusIcon(status)}
                      </div>
                    </div>

                    {/* Submission Info */}
                    {hw.submission && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Submitted</p>
                            <p className="text-xs text-gray-500">{formatDateTime(hw.submission.submitted_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {hw.submission.score}/{hw.submission.max_score}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round((hw.submission.score / hw.submission.max_score) * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Assigned by {hw.assigned_by.first_name} {hw.assigned_by.last_name}
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          {hw.submission ? 'View Submission' : 'Start Assignment'}
                        </button>
                        {user?.role === 'TEACHER' && (
                          <button className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                            <TrendingUp className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredHomework.length === 0 && (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No homework found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'No assignments match your criteria'}
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
