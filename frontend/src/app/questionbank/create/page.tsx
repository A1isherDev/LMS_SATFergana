'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { questionBankApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Save, Loader } from 'lucide-react';

export default function CreateQuestionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Initial state matching Question interface logic
    const [formData, setFormData] = useState({
        question_text: '',
        question_type: 'MULTIPLE_CHOICE', // MULTIPLE_CHOICE, TEXT, MATH
        subject: 'MATH', // MATH, READING, WRITING
        difficulty: 'MEDIUM',
        correct_answer: '',
        explanation: '',
        options: ['', '', '', ''], // For multiple choice
        tags: '', // Comma separated
        is_active: true
    });

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const dataToSubmit: any = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                options: formData.question_type === 'MULTIPLE_CHOICE' ? formData.options : []
            };

            await questionBankApi.createQuestion(dataToSubmit);
            router.push('/questionbank');
        } catch (error) {
            console.error('Error creating question:', error);
            alert('Failed to create question');
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Subject</label>
                                <select
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="MATH">Math</option>
                                    <option value="READING">Reading</option>
                                    <option value="WRITING">Writing</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    value={formData.question_type}
                                    onChange={e => setFormData({ ...formData, question_type: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                    <option value="MATH">Grid-in / Math</option>
                                    <option value="TEXT">Text Response</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Difficulty</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>
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

                        {formData.question_type === 'MULTIPLE_CHOICE' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium">Options</label>
                                {formData.options.map((option, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-6 text-center font-bold text-gray-500">{String.fromCharCode(65 + idx)}</span>
                                        <input
                                            type="text"
                                            required
                                            value={option}
                                            onChange={e => handleOptionChange(idx, e.target.value)}
                                            className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                        />
                                        <input
                                            type="radio"
                                            name="correct_answer"
                                            checked={formData.correct_answer === option && option !== ''}
                                            onChange={() => setFormData({ ...formData, correct_answer: option })}
                                            className="h-4 w-4"
                                            title="Mark as correct answer"
                                        />
                                    </div>
                                ))}
                                <p className="text-xs text-gray-400">Select the radio button next to the correct answer.</p>
                            </div>
                        )}

                        {formData.question_type !== 'MULTIPLE_CHOICE' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Correct Answer</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.correct_answer}
                                    onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Exact answer key"
                                />
                            </div>
                        )}

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

                        <div>
                            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                placeholder="algebra, geometry, grammar..."
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
