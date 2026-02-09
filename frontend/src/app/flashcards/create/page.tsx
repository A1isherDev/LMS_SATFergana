'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { flashcardsApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Save, Loader } from 'lucide-react';

export default function CreateFlashcardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Initial state
    const [formData, setFormData] = useState({
        word: '',
        definition: '',
        example_sentence: '',
        difficulty: 'MEDIUM',
        subject: 'READING', // Default to reading/vocab
        pronunciation: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await flashcardsApi.createFlashcard(formData);
            router.push('/flashcards');
        } catch (error) {
            console.error('Error creating flashcard:', error);
            alert('Failed to create flashcard');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Flashcard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Add a new vocabulary word or concept</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">

                        <div>
                            <label className="block text-sm font-medium mb-1">Subject</label>
                            <select
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="READING">Reading / Vocabulary</option>
                                <option value="WRITING">Writing</option>
                                <option value="MATH">Math</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Word / Term</label>
                            <input
                                type="text"
                                required
                                value={formData.word}
                                onChange={e => setFormData({ ...formData, word: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-lg font-medium"
                                placeholder="e.g. Ephemeral"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Definition</label>
                            <textarea
                                required
                                value={formData.definition}
                                onChange={e => setFormData({ ...formData, definition: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 min-h-[100px]"
                                placeholder="Definition of the term..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Example Sentence</label>
                            <textarea
                                value={formData.example_sentence}
                                onChange={e => setFormData({ ...formData, example_sentence: e.target.value })}
                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Use in a sentence..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-sm font-medium mb-1">Pronunciation (Opt)</label>
                                <input
                                    type="text"
                                    value={formData.pronunciation}
                                    onChange={e => setFormData({ ...formData, pronunciation: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="e.g. ə-ˈfem-rəl"
                                />
                            </div>
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
                                Add Card
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
