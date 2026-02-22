'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
<<<<<<< HEAD
import { homeworkApi, classesApi } from '@/utils/api';
=======
import { formatDate } from '@/utils/helpers';
import { classesApi, homeworkApi } from '@/utils/api';
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c

interface Question {
  id: string;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TEXT' | 'TRUE_FALSE';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
}

interface HomeworkFormData {
  title: string;
  description: string;
  class_id: number;
  due_date: string;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  is_published: boolean;
  topic?: string;
  questions: Question[];
}

interface Class {
  id: number;
  name: string;
  description: string;
  student_count: number;
}

export default function CreateHomeworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const classIdParam = searchParams.get('class_id');
  const titleParam = searchParams.get('title');
  const descParam = searchParams.get('description');
  const topicParam = searchParams.get('topic');

  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState<HomeworkFormData>({
    title: titleParam || '',
    description: descParam || '',
    class_id: classIdParam ? parseInt(classIdParam) : 0,
    due_date: '',
    difficulty_level: 'MEDIUM',
    is_published: false,
    topic: topicParam || '',
    questions: []
  });

  // Fetch classes for the teacher
  useEffect(() => {
    const fetchClasses = async () => {
      try {
<<<<<<< HEAD
        const response: any = await classesApi.getClasses();
        setClasses(response.results || response);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
=======
        const data = await classesApi.getMyClasses() as { results?: Class[] } | Class[];
        setClasses(Array.isArray(data) ? data : (data.results || []));
      } catch (error) {
        console.error('Error fetching classes:', error);
        setClasses([]);
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
      }
    };

    if (user?.role === 'TEACHER') {
      fetchClasses();
    }
  }, [user]);

  const handleInputChange = (field: keyof HomeworkFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 10
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id) {
      alert('Please select a class.');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Publishing assignment...');

    try {
<<<<<<< HEAD
      await homeworkApi.createHomework(formData);
      toast.success('Assignment published successfully', { id: toastId });
      router.push('/homework');
    } catch (error: any) {
      console.error('Error creating homework:', error);
      const message = error.response?.data?.detail || 'Failed to create homework';
      toast.error(`Error: ${message}`, { id: toastId });
=======
      const payload = {
        title: formData.title,
        description: formData.description,
        class_obj: formData.class_id,
        due_date: formData.due_date || null,
        difficulty_level: formData.difficulty_level,
        is_published: formData.is_published,
        questions: formData.questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || '',
          points: q.points || 10
        }))
      };
      await homeworkApi.createHomework(payload);
      router.push('/homework');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (typeof err?.response?.data === 'object' ? JSON.stringify(err.response?.data) : 'Failed to create homework.');
      alert(msg);
>>>>>>> bb6d2861f150c00700c6a138ec5028042b66f56c
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'TEACHER') {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Only teachers can create homework assignments.</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Homework
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Homework</h1>
                <p className="text-gray-600">Create a new assignment for your students</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Algebra Practice Set #5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class *
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => handleInputChange('class_id', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.student_count} students)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what students should do in this assignment..."
                />
              </div>

              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => handleInputChange('is_published', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Publish immediately (students can see this homework)
                  </span>
                </label>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </button>
              </div>

              {formData.questions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No questions added yet</p>
                  <p className="text-sm text-gray-500 mt-2">Click "Add Question" to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Type
                          </label>
                          <select
                            value={question.question_type}
                            onChange={(e) => updateQuestion(question.id, 'question_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                            <option value="TEXT">Text Answer</option>
                            <option value="TRUE_FALSE">True/False</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text *
                          </label>
                          <textarea
                            required
                            value={question.question_text}
                            onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your question here..."
                          />
                        </div>

                        {question.question_type === 'MULTIPLE_CHOICE' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Options (one per line)
                            </label>
                            <textarea
                              value={question.options?.join('\n') || ''}
                              onChange={(e) => updateQuestion(question.id, 'options', e.target.value.split('\n'))}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Correct Answer *
                            </label>
                            <input
                              type="text"
                              required
                              value={question.correct_answer}
                              onChange={(e) => updateQuestion(question.id, 'correct_answer', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={question.question_type === 'MULTIPLE_CHOICE' ? 'A, B, C, or D' : 'Enter correct answer'}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={question.points}
                              onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Explanation (optional)
                          </label>
                          <textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Explain why this is the correct answer..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title || !formData.class_id || !formData.due_date}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Homework'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
