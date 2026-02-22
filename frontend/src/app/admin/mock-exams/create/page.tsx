'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FileText, BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { bluebookApi } from '@/utils/api';

export default function AdminMockExamCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user && user.role !== 'ADMIN' && user.role !== 'TEACHER') {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-500 mb-6">Only admins and teachers can create mock exams.</p>
            <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Return to Dashboard
            </button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a test title');
      return;
    }
    try {
      setIsSubmitting(true);
      const exam = await bluebookApi.createExam({
        title: title.trim(),
        description: description.trim() || undefined,
      }) as { id: number; title: string };
      await bluebookApi.populateQuestions(exam.id);
      toast.success('Digital SAT test created and populated with questions from the question bank.');
      router.push('/mockexams/bluebook');
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.message || 'Failed to create test';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create DSAT Mock Exam</h1>
                <p className="text-gray-500 text-sm">Digital SAT structure: English 27+27, Math 22+22</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Question source
              </h3>
              <p className="text-sm text-slate-600">
                Questions are automatically selected from the Question Bank: Reading & Writing (54 total) and Math (44 total), with 27 per English module and 22 per Math module.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Test title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Digital SAT Practice Test 1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this test"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {isSubmitting ? 'Creating…' : 'Create test'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
