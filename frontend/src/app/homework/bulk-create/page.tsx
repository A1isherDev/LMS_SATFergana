'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, Loader2, Calendar, BookOpen } from 'lucide-react';
import { classesApi, homeworkApi } from '@/utils/api';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';

interface BulkHomeworkRow {
    title: string;
    description: string;
    due_date: string;
    class_obj: number;
}

export default function BulkHomeworkPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<number>(0);
    const [rows, setRows] = useState<BulkHomeworkRow[]>([
        { title: '', description: '', due_date: '', class_obj: 0 }
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const data: any = await classesApi.getClasses();
            setClasses(data.results || data);
            if (data.results?.length > 0) {
                setSelectedClass(data.results[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addRow = () => {
        setRows([...rows, { title: '', description: '', due_date: '', class_obj: selectedClass }]);
    };

    const removeRow = (index: number) => {
        if (rows.length === 1) return;
        setRows(rows.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, field: keyof BulkHomeworkRow, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedClass === 0) {
            alert('Please select a class');
            return;
        }

        const payload = rows.map(row => ({
            ...row,
            class_obj: selectedClass,
            // Add more defaults if needed (e.g. max_score)
            max_score: 100,
            is_published: true,
            questions: [] // Simplified for bulk creation metadata
        }));

        // Basic validation
        if (payload.some(p => !p.title || !p.due_date)) {
            alert('Please fill in required fields (Title and Due Date) for all rows');
            return;
        }

        setIsSubmitting(true);
        try {
            await homeworkApi.bulkCreateHomework(payload);
            alert('Homework created successfully!');
            router.push('/homework');
        } catch (error) {
            console.error('Error creating homework:', error);
            alert('Failed to create homework. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AuthGuard>
                <DashboardLayout>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                </DashboardLayout>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <DashboardLayout>
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Bulk Homework Creation</h1>
                                <p className="text-sm text-gray-500">Create multiple assignments for a class at once</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium text-gray-700">Target Class:</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(parseInt(e.target.value))}
                                    className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                >
                                    <option value={0}>Select a class...</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Title*</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Due Date*</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rows.map((row, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Math Review #1"
                                                    value={row.title}
                                                    onChange={(e) => updateRow(index, 'title', e.target.value)}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <textarea
                                                    rows={1}
                                                    placeholder="Short description..."
                                                    value={row.description}
                                                    onChange={(e) => updateRow(index, 'description', e.target.value)}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm resize-none"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <input
                                                        type="datetime-local"
                                                        required
                                                        value={row.due_date}
                                                        onChange={(e) => updateRow(index, 'due_date', e.target.value)}
                                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(index)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                    disabled={rows.length === 1}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={addRow}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add Another Assignment</span>
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting || selectedClass === 0}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>Create {rows.length} Assignments</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
