'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';

export default function MockExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Mock Exam #{examId}
              </h1>
              <p className="text-gray-600">
                This is the traditional mock exam interface.
              </p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Looking for Digital SAT?</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Try our new Digital SAT practice with adaptive modules and built-in calculator!
                </p>
                <button
                  onClick={() => router.push('/mockexams/bluebook')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Digital SAT
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
