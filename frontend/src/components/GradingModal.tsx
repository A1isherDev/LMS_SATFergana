'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Save } from 'lucide-react';

interface Question {
    id: number;
    question_text: string;
    correct_answer: string;
    points: number;
}

interface Submission {
    id: number;
    student: {
        first_name: string;
        last_name: string;
    };
    answers: Record<string, string>;
    score: number;
    max_score: number;
    feedback?: string;
}

interface GradingModalProps {
    submission: Submission;
    questions: Question[];
    onClose: () => void;
    onSave: (score: number, feedback: string) => void;
}

export default function GradingModal({
    submission,
    questions,
    onClose,
    onSave
}: GradingModalProps) {
    const [score, setScore] = useState(submission.score);
    const [feedback, setFeedback] = useState(submission.feedback || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/homework/submissions/${submission.id}/grade/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ score, feedback }),
            });

            if (response.ok) {
                onSave(score, feedback);
                onClose();
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail || 'Failed to save grade'}`);
            }
        } catch (error) {
            console.error('Error saving grade:', error);
            alert('Error saving grade. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Grade Submission</h2>
                        <p className="text-sm text-gray-600">
                            Student: {submission.student.first_name} {submission.student.last_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Answers Review */}
                    <div className="space-y-6">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Answers Review</h3>
                        {questions.map((q, index) => {
                            const studentAnswer = submission.answers[q.id.toString()];
                            const isCorrect = studentAnswer === q.correct_answer;

                            return (
                                <div key={q.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-medium text-gray-900">Question {index + 1}</p>
                                        <div className="flex items-center">
                                            {isCorrect ? (
                                                <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-red-500 mr-1" />
                                            )}
                                            <span className="text-sm font-medium">{q.points} pts</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-700 mb-3">{q.question_text}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Student Answer</p>
                                            <p className={`p-2 rounded mt-1 border ${isCorrect ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                                {studentAnswer || 'No answer'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase">Correct Answer</p>
                                            <p className="p-2 rounded mt-1 border bg-blue-50 border-blue-100 text-blue-800">
                                                {q.correct_answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Grading Form */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-gray-900">Final Grade & Feedback</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Adjusted Score
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={score}
                                        onChange={(e) => setScore(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-500">/ {submission.max_score}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teacher Feedback
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Provide constructive feedback to the student..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end p-6 border-t bg-gray-50 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Saving...' : 'Save Grade & Feedback'}
                    </button>
                </div>
            </div>
        </div>
    );
}
