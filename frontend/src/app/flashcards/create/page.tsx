'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { flashcardsApi } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { Save, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateFlashcardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Initial state matching backend Flashcard model
    const [formData, setFormData] = useState({
        word: '',
        definition: '',
        example_sentence: '',
        difficulty: 3, // Backend expects integer 1-5
        part_of_speech: 'OTHER', // NOUN, VERB, ADJECTIVE, ADVERB, OTHER
        synonyms: '',
        antonyms: '',
        is_active: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading('Creating flashcard...');

        try {
            await flashcardsApi.createFlashcard(formData);
            toast.success('Flashcard created successfully', { id: toastId });
            router.push('/flashcards');
        } catch (error) {
            console.error('Error creating flashcard:', error);
            const errorMessage = (error as any).response?.data?.word?.[0] || 'Failed to create flashcard';
            toast.error(errorMessage, { id: toastId });
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Part of Speech</label>
                                <select
                                    value={formData.part_of_speech}
                                    onChange={e => setFormData({ ...formData, part_of_speech: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="NOUN">Noun</option>
                                    <option value="VERB">Verb</option>
                                    <option value="ADJECTIVE">Adjective</option>
                                    <option value="ADVERB">Adverb</option>
                                    <option value="OTHER">Other</option>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Synonyms (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.synonyms}
                                    onChange={e => setFormData({ ...formData, synonyms: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="fleeting, transient..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Antonyms (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.antonyms}
                                    onChange={e => setFormData({ ...formData, antonyms: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="eternal, lasting..."
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
