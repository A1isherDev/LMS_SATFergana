'use client';

import { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface StudentEnrollmentModalProps {
    classId: number;
    currentStudents: Student[];
    onClose: () => void;
    onEnroll: (studentIds: number[]) => void;
}

export default function StudentEnrollmentModal({
    classId,
    currentStudents,
    onClose,
    onEnroll
}: StudentEnrollmentModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch available students (not already in class)
    useState(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch('/api/users/?role=STUDENT', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });

                if (response.ok) {
                    const allStudents = await response.json();
                    const currentStudentIds = currentStudents.map(s => s.id);
                    const available = allStudents.filter((s: Student) => !currentStudentIds.includes(s.id));
                    setAvailableStudents(available);
                } else {
                    // Mock data for development
                    setAvailableStudents([
                        { id: 10, first_name: 'Emma', last_name: 'Davis', email: 'emma@example.com' },
                        { id: 11, first_name: 'Michael', last_name: 'Brown', email: 'michael@example.com' },
                        { id: 12, first_name: 'Sophia', last_name: 'Wilson', email: 'sophia@example.com' },
                    ]);
                }
            } catch (error) {
                console.error('Error fetching students:', error);
                setAvailableStudents([
                    { id: 10, first_name: 'Emma', last_name: 'Davis', email: 'emma@example.com' },
                    { id: 11, first_name: 'Michael', last_name: 'Brown', email: 'michael@example.com' },
                    { id: 12, first_name: 'Sophia', last_name: 'Wilson', email: 'sophia@example.com' },
                ]);
            }
        };

        fetchStudents();
    });

    const filteredStudents = availableStudents.filter(student =>
        `${student.first_name} ${student.last_name} ${student.email}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    const toggleStudent = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleEnroll = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/classes/${classId}/enroll_students/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ student_ids: selectedStudents }),
            });

            if (response.ok) {
                onEnroll(selectedStudents);
                onClose();
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail || 'Failed to enroll students'}`);
            }
        } catch (error) {
            console.error('Error enrolling students:', error);
            alert('Error enrolling students. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Enroll Students</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search students by name or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <UserPlus className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p>No available students found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredStudents.map((student) => (
                                <label
                                    key={student.id}
                                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                            {student.first_name} {student.last_name}
                                        </p>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
                        {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEnroll}
                            disabled={isLoading || selectedStudents.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Enrolling...' : `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
