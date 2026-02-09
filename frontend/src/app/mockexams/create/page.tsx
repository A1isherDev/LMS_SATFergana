'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { mockExamsApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Save, Plus, X, Loader } from 'lucide-react';

export default function CreateMockExamPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        exam_type: 'FULL',
        time_limit_minutes: 134, // Standard SAT time
        is_active: false
    });

    // In a real implementation, we would also select questions or sections here

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await mockExamsApi.createExam(formData);
            router.push('/mockexams');
        } catch (error) {
            console.error('Error creating exam:', error);
            alert('Failed to create mock exam');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Mock Exam</h1>
                        <p className="text-gray-500 dark:text-gray-400">Design a new SAT practice exam</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Exam Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., Spring 2026 Practice Test 1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                                placeholder="Description of the exam content..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    value={formData.exam_type}
                                    onChange={e => setFormData({ ...formData, exam_type: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="FULL">Full Length</option>
                                    <option value="MATH">Math Only</option>
                                    <option value="READING">Reading & Writing</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Time Limit (mins)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.time_limit_minutes}
                                    onChange={e => setFormData({ ...formData, time_limit_minutes: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium">Publish immediately</label>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                            >
                                {isLoading ? <Loader className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Create Exam
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
