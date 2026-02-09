'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { classesApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import {
    BarChart3,
    Download
} from 'lucide-react';

interface ClassSummary {
    id: number;
    name: string;
    teacher: number;
    students: number[];
}

interface GradebookData {
    students: {
        id: number;
        name: string;
        email: string;
    }[];
    assignments: {
        id: number;
        title: string;
        max_score: number;
        due_date: string;
    }[];
    grades: Record<string, Record<string, {
        score: number;
        submitted_at: string;
        is_late: boolean;
        status: string;
    }>>;
}

export default function GradebookPage() {
    const [classes, setClasses] = useState<ClassSummary[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [gradebookData, setGradebookData] = useState<GradebookData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingGradebook, setLoadingGradebook] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchGradebook(selectedClassId);
        } else {
            setGradebookData(null);
        }
    }, [selectedClassId]);

    const fetchClasses = async () => {
        try {
            const response = await classesApi.getClasses();
            // filtering is handled by backend for teachers
            // Cast response to unknown then to ClassSummary[] because api returns generic type
            const classList = (Array.isArray(response) ? response : (response as any).results || []) as ClassSummary[];
            setClasses(classList);

            if (classList.length > 0) {
                setSelectedClassId(classList[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchGradebook = async (classId: number) => {
        setLoadingGradebook(true);
        try {
            const data = await classesApi.getGradebook(classId);
            setGradebookData(data as unknown as GradebookData);
        } catch (error) {
            console.error('Error fetching gradebook:', error);
            toast.error('Failed to load gradebook');
        } finally {
            setLoadingGradebook(false);
        }
    };

    const calculateStudentAverage = (studentId: number) => {
        if (!gradebookData) return 0;

        const studentGrades = gradebookData.grades[studentId] || {};
        let totalScore = 0;
        let totalMaxScore = 0;

        gradebookData.assignments.forEach(assignment => {
            const grade = studentGrades[assignment.id];
            if (grade && grade.score !== null) {
                totalScore += grade.score;
                totalMaxScore += assignment.max_score;
            }
        });

        return totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    };

    const calculateAssignmentAverage = (assignmentId: number) => {
        if (!gradebookData) return 0;

        let totalScore = 0;
        let count = 0;

        gradebookData.students.forEach(student => {
            const grade = gradebookData.grades[student.id]?.[assignmentId];
            if (grade && grade.score !== null) {
                const assignment = gradebookData.assignments.find(a => a.id === assignmentId);
                if (assignment && assignment.max_score > 0) {
                    totalScore += (grade.score / assignment.max_score) * 100;
                    count++;
                }
            }
        });

        return count > 0 ? Math.round(totalScore / count) : 0;
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 bg-green-50';
        if (percentage >= 80) return 'text-blue-600 bg-blue-50';
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <AuthGuard requireAuth={true}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                View and manage student grades across all assignments
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={selectedClassId || ''}
                                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    {classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => toast.success('Export feature coming soon!')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Gradebook Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                        {loadingGradebook ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : !gradebookData || gradebookData.students.length === 0 ? (
                            <div className="text-center py-12">
                                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {classes.length === 0
                                        ? "You don't have any classes yet."
                                        : "This class doesn't have any students or assignments yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-gray-50 border-r border-gray-200 min-w-[200px]">
                                                Student
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                                                Average
                                            </th>
                                            {gradebookData.assignments.map((assignment) => (
                                                <th key={assignment.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-semibold text-gray-700">{assignment.title}</span>
                                                        <span className="text-[10px] text-gray-400 mt-1">Out of {assignment.max_score}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {/* Averages Row */}
                                        <tr className="bg-gray-50 font-medium">
                                            <td className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-gray-50 border-r border-gray-200">
                                                Class Average
                                            </td>
                                            <td className="px-6 py-3 text-center text-sm text-gray-500">
                                                -
                                            </td>
                                            {gradebookData.assignments.map((assignment) => (
                                                <td key={assignment.id} className="px-6 py-3 text-center text-sm text-gray-700">
                                                    {calculateAssignmentAverage(assignment.id)}%
                                                </td>
                                            ))}
                                        </tr>

                                        {/* Student Rows */}
                                        {gradebookData.students.map((student) => {
                                            const average = calculateStudentAverage(student.id);
                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 z-10 bg-white border-r border-gray-200 group-hover:bg-gray-50">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                                <div className="text-xs text-gray-500">{student.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(average)}`}>
                                                            {average}%
                                                        </span>
                                                    </td>
                                                    {gradebookData.assignments.map((assignment) => {
                                                        const grade = gradebookData.grades[student.id]?.[assignment.id];
                                                        return (
                                                            <td key={assignment.id} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                                {grade ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="font-medium text-gray-900">{grade.score}</span>
                                                                        {grade.is_late && (
                                                                            <span className="text-[10px] text-red-600 mt-0.5">Late</span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
