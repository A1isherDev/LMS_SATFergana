'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { questionBankApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateQuestionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Initial state matching Question model
    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'MATH', // MATH, READING, WRITING
        skill_tag: '', // backend expects string
        difficulty: 3, // Backend expects integer 1-5
        correct_answer: 'A', // A, B, C, D
        explanation: '',
        options: {
            A: '',
            B: '',
            C: '',
            D: ''
        },
        estimated_time_seconds: 60,
        is_active: true
    });

    const handleOptionChange = (key: string, value: string) => {
        setFormData({
            ...formData,
            options: {
                ...formData.options,
                [key]: value
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Adding question to bank...');

        try {
            // Validate that we have options if it's multiple choice (though it's always JSON in model)
            await questionBankApi.createQuestion(formData);
            toast.success('Question added successfully', { id: toastId });
            router.push('/questionbank');
        } catch (error) {
            console.error('Error creating question:', error);
            const data = (error as any).response?.data;
            const errorMessage = typeof data === 'object' ? Object.values(data).flat()[0] as string : 'Failed to create question';
            toast.error(errorMessage || 'Failed to create question. Please check your input.', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-3xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Question</h1>
                        <p className="text-gray-500 dark:text-gray-400">Add a question to the global question bank</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Subject / Section</label>
                                <select
                                    value={formData.question_type}
                                    onChange={e => setFormData({ ...formData, question_type: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="MATH">Math</option>
                                    <option value="READING">Reading</option>
                                    <option value="WRITING">Writing</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Difficulty (1-5)</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={e => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="1">1 - Easiest</option>
                                    <option value="2">2</option>
                                    <option value="3">3 - Medium</option>
                                    <option value="4">4</option>
                                    <option value="5">5 - Hardest</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Est. Time (seconds)</label>
                                <input
                                    type="number"
                                    value={formData.estimated_time_seconds}
                                    onChange={e => setFormData({ ...formData, estimated_time_seconds: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Skill Tag / Topic</label>
                            <input
                                type="text"
                                required
                                value={formData.skill_tag}
                                onChange={e => setFormData({ ...formData, skill_tag: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                placeholder="e.g. Algebra, Main Idea, Grammar"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Question Text</label>
                            <textarea
                                required
                                value={formData.question_text}
                                onChange={e => setFormData({ ...formData, question_text: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono text-sm min-h-[100px]"
                                placeholder="Enter the question text here..."
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Options & Correct Answer</label>
                            {(['A', 'B', 'C', 'D'] as const).map((key) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className="w-6 text-center font-bold text-gray-500">{key}</span>
                                    <input
                                        type="text"
                                        required
                                        value={formData.options[key]}
                                        onChange={e => handleOptionChange(key, e.target.value)}
                                        className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                        placeholder={`Option ${key}`}
                                    />
                                    <input
                                        type="radio"
                                        name="correct_answer"
                                        checked={formData.correct_answer === key}
                                        onChange={() => setFormData({ ...formData, correct_answer: key })}
                                        className="h-4 w-4"
                                        title="Mark as correct answer"
                                    />
                                </div>
                            ))}
                            <p className="text-xs text-gray-400">Select the radio button next to the correct answer.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Explanation</label>
                            <textarea
                                value={formData.explanation}
                                onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                rows={3}
                                placeholder="Explain why the answer is correct..."
                            />
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
                                Save Question
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
