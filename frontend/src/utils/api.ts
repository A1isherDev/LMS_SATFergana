import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, HTTP_STATUS } from '../config/api';
import { AuthResponse } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, but don't immediately logout
        // Only clear tokens and redirect if it's a clear auth failure
        console.error('Token refresh failed:', refreshError);

        // Check if this is an authentication failure
        if (axios.isAxiosError(refreshError) && refreshError.response) {
          if (refreshError.response.status === 401) {
            // Clear tokens and redirect only for clear auth failures
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API methods
export const apiClient = {
  // GET requests
  get: async <T>(url: string, config?: any): Promise<T> => {
    const response = await api.get<T>(url, config);
    return response.data;
  },

  // POST requests
  post: async <T>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  // PUT requests
  put: async <T>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  // PATCH requests
  patch: async <T>(url: string, data?: any, config?: any): Promise<T> => {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  // DELETE requests
  delete: async <T>(url: string, config?: any): Promise<T> => {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};

// Auth API methods
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiClient.post('/auth/login/', { email, password });
  },

  register: async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    invitation_code: string;
  }): Promise<AuthResponse> => {
    return apiClient.post('/auth/register/', userData);
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    return apiClient.post('/auth/refresh/', { refresh });
  },

  verifyToken: async (token: string): Promise<any> => {
    return apiClient.post('/auth/verify/', { token });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getUserProfile: async () => {
    // Use /users/me/ to fetch current user's profile
    return apiClient.get('/users/me/');
  },

  updateProfile: async (data: any) => {
    return apiClient.patch('/users/me/', data);
  },
};

// Users API methods
export const usersApi = {
  getProfile: async () => {
    // Return current user's profile
    return apiClient.get('/users/me/');
  },

  updateProfile: async (data: any) => {
    // Update current user's profile
    return apiClient.patch('/users/me/', data);
  },

  getInvitations: async () => {
    return apiClient.get('/invitations/');
  },

  createInvitation: async (data: { email: string; role: string }) => {
    return apiClient.post('/invitations/', data);
  },

  deleteInvitation: async (id: number) => {
    return apiClient.delete(`/invitations/${id}/`);
  },

  getStudentProfile: async () => {
    return apiClient.get('/student-profiles/me/');
  },

  updateStudentProfile: async (data: any) => {
    return apiClient.patch('/student-profiles/me/', data);
  },

  updateExamDate: async (examDate: string) => {
    return apiClient.patch('/student-profiles/exam_date/', { sat_exam_date: examDate });
  },

  updateStreak: async () => {
    return apiClient.post('/users/update_streak/');
  },
};

// Admin API methods
export const adminApi = {
  getUsers: async (params?: { search?: string; role?: string; page?: number }) => {
    return apiClient.get('/users/', params);
  },

  updateUser: async (id: number, data: any) => {
    return apiClient.patch(`/users/${id}/`, data);
  },

  deleteUser: async (id: number) => {
    return apiClient.delete(`/users/${id}/`);
  },

  getSystemStats: async () => {
    return apiClient.get('/analytics/system/stats/');
  },

  getSystemConfig: async () => {
    return apiClient.get('/admin/config/');
  },

  updateSystemConfig: async (data: any) => {
    return apiClient.post('/admin/config/update/', data);
  },

  getSystemLogs: async (params?: { level?: string; limit?: number }) => {
    return apiClient.get('/analytics/system/logs/', { params });
  }
};

// Analytics API methods moved here and merged
export const analyticsApi = {
  getStudentProgress: async () => {
    return apiClient.get('/analytics/student-progress/my_progress/');
  },
  getProgressChart: async (params?: { period?: string; metric?: string }) => {
    return apiClient.get('/analytics/student-progress/progress_chart/', params);
  },
  getMyWeakAreas: async () => {
    return apiClient.get('/analytics/weak-areas/my_weak_areas/');
  },
  getMySessions: async (params?: { start_date?: string; end_date?: string }) => {
    return apiClient.get('/analytics/study-sessions/my_sessions/', params);
  },
  getStudentSummary: async () => {
    return apiClient.get('/analytics/student_summary/');
  },
  getStudentSummaryById: async (studentId: number) => {
    return apiClient.get('/analytics/student_summary/', { student_id: studentId });
  },
  getClassAnalytics: async (classId: number) => {
    return apiClient.get(`/analytics/class_analytics/${classId}/`);
  },
  getDashboardStats: async () => {
    return apiClient.get('/dashboard/stats/');
  },
  getSystemHealth: async () => {
    return apiClient.get('/system/health/');
  },
  getPerformanceTrends: async (params?: { period_type?: string }) => {
    return apiClient.get('/analytics/student-progress/performance_trends/', params);
  },
  startStudySession: async (sessionType: string = 'practice') => {
    return apiClient.post('/analytics/study-sessions/', { session_type: sessionType });
  },
  endStudySession: async (sessionId: number) => {
    return apiClient.patch(`/analytics/study-sessions/${sessionId}/`, { ended_at: new Date().toISOString() });
  },
  updateActiveSession: async (sessionId: number, data: { duration_minutes?: number, questions_attempted?: number, questions_correct?: number, flashcards_reviewed?: number }) => {
    return apiClient.patch(`/analytics/study-sessions/${sessionId}/`, data);
  },
  getActiveSession: async () => {
    return apiClient.get('/analytics/study-sessions/active_session/');
  },
  getTopicAnalytics: async () => {
    return apiClient.get('/analytics/weak-areas/topic_analytics/');
  },
  exportAnalytics: async () => {
    return api.get('/analytics/student-progress/export_analytics/', { responseType: 'blob' });
  },
};

// Classes API methods
export const classesApi = {
  getClasses: async () => {
    return apiClient.get('/classes/');
  },

  getStudentClasses: async () => {
    return apiClient.get('/classes/my_classes/');
  },

  getClass: async (id: number) => {
    return apiClient.get(`/classes/${id}/`);
  },

  createClass: async (data: any) => {
    return apiClient.post('/classes/', data);
  },

  updateClass: async (id: number, data: any) => {
    return apiClient.patch(`/classes/${id}/`, data);
  },

  deleteClass: async (id: number) => {
    return apiClient.delete(`/classes/${id}/`);
  },

  getClassLeaderboard: async (id: number, period: string = 'all_time') => {
    return apiClient.get(`/classes/${id}/leaderboard/?period=${period}`);
  },

  postAnnouncement: async (id: number, data: { title: string, content: string }) => {
    return apiClient.post(`/classes/${id}/post_announcement/`, data);
  },

  getAnnouncements: async (id: number) => {
    return apiClient.get(`/classes/${id}/announcements/`);
  },

  getGradebook: async (id: number) => {
    return apiClient.get(`/classes/${id}/gradebook/`);
  },

  getResources: async (params?: { class_id?: number }) => {
    return apiClient.get('/class-resources/', { params });
  },

  createResource: async (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return apiClient.post('/class-resources/', formData);
  },

  deleteResource: async (id: number) => {
    return apiClient.delete(`/class-resources/${id}/`);
  },
};

// Questions API methods
export const questionsApi = {
  getQuestions: async (params?: any) => {
    return apiClient.get('/questions/', { params });
  },

  getQuestion: async (id: number) => {
    return apiClient.get(`/questions/${id}/`);
  },

  getPracticeQuestions: async (params?: { count?: number; skill_tag?: string; difficulty?: string; question_type?: string }) => {
    return apiClient.get('/questions/practice/', { params });
  },

  submitAttempt: async (id: number, data: { selected_option?: string; grid_answer?: string; time_spent_seconds?: number, context?: string }) => {
    return apiClient.post(`/questions/${id}/attempt/`, data);
  },

  getStats: async (params?: any) => {
    return apiClient.get('/questions/stats/', { params });
  },
};

// Homework API methods
export const homeworkApi = {
  getHomework: async (params?: { class?: number; status?: string }) => {
    return apiClient.get('/homework/', { params });
  },

  getStudentHomework: async () => {
    return apiClient.get('/homework/');
  },

  getHomeworkDetail: async (id: number) => {
    return apiClient.get(`/homework/${id}/`);
  },

  createHomework: async (data: any) => {
    return apiClient.post('/homework/', data);
  },

  bulkCreateHomework: async (data: any[]) => {
    return apiClient.post('/homework/bulk_create/', data);
  },

  submitHomework: async (id: number, data: any) => {
    return apiClient.post(`/homework/${id}/submit/`, data);
  },

  getMySubmissions: async () => {
    return apiClient.get('/submissions/');
  },
  getStudentProgress: async () => {
    return apiClient.get('/submissions/my_progress/');
  },
  exportGrades: async (params?: { class_id?: number }) => {
    return apiClient.get('/homework/export_grades/', { params, responseType: 'blob' });
  },
  getSubmission: async (submissionId: number) => {
    return apiClient.get(`/submissions/${submissionId}/`);
  },
};

// Question Bank API methods
export const questionBankApi = {
  getQuestions: async (params?: {
    subject?: string;
    difficulty?: string;
    question_type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    return apiClient.get('/questionbank/questions/', { params });
  },

  getQuestion: async (id: number) => {
    return apiClient.get(`/questionbank/questions/${id}/`);
  },

  createQuestion: async (data: any) => {
    return apiClient.post('/questionbank/questions/', data);
  },

  updateQuestion: async (id: number, data: any) => {
    return apiClient.patch(`/questionbank/questions/${id}/`, data);
  },

  deleteQuestion: async (id: number) => {
    return apiClient.delete(`/questionbank/questions/${id}/`);
  },

  submitAttempt: async (data: {
    question: number;
    selected_answer: string;
    time_taken_seconds: number;
    attempt_type: string;
  }) => {
    return apiClient.post('/questionbank/attempts/', data);
  },

  getMyAttempts: async (params?: { question_type?: string; limit?: number }) => {
    return apiClient.get('/questionbank/my_attempts/', { params });
  },

  getAttemptHistory: async (questionId: number) => {
    return apiClient.get(`/questionbank/questions/${questionId}/attempts/`);
  },
};

// Bluebook Digital SAT API methods
export const bluebookApi = {
  getExams: async () => {
    return apiClient.get('/bluebook/exams/');
  },

  getExam: async (id: number) => {
    return apiClient.get(`/bluebook/exams/${id}/`);
  },

  getExamStructure: async (id: number) => {
    return apiClient.get(`/bluebook/exams/${id}/structure/`);
  },

  startExam: async (id: number) => {
    return apiClient.post(`/bluebook/exams/${id}/start_attempt/`);
  },

  getAttempts: async () => {
    return apiClient.get('/bluebook/attempts/');
  },

  getAttempt: async (id: number) => {
    return apiClient.get(`/bluebook/attempts/${id}/`);
  },

  startAttempt: async (id: number) => {
    return apiClient.post(`/bluebook/attempts/${id}/start_exam/`);
  },

  getStatus: async (id: number) => {
    return apiClient.get(`/bluebook/attempts/${id}/status/`);
  },

  getCurrentModule: async (id: number) => {
    return apiClient.get(`/bluebook/attempts/${id}/current_module/`);
  },

  submitModule: async (id: number, data: {
    answers: Record<string, string>;
    flagged_questions?: number[]
  }) => {
    return apiClient.post(`/bluebook/attempts/${id}/submit_module/`, data);
  },

  flagQuestion: async (id: number, data: {
    question_id: number;
    flagged: boolean
  }) => {
    return apiClient.post(`/bluebook/attempts/${id}/flag_question/`, data);
  },

  getResults: async (id: number) => {
    return apiClient.get(`/bluebook/attempts/${id}/results/`);
  },

  completeExam: async (id: number) => {
    return apiClient.post(`/bluebook/attempts/${id}/complete_exam/`);
  },

  getAnalytics: async () => {
    return apiClient.get('/bluebook/analytics/performance_analytics/');
  },

  getAdaptivePerformance: async () => {
    return apiClient.get('/bluebook/analytics/adaptive_performance/');
  },

  getExamStatistics: async () => {
    return apiClient.get('/bluebook/management/exam_statistics/');
  },
};

// Mock Exams API methods
export const mockExamsApi = {
  getExams: async () => {
    return apiClient.get('/mock-exams/');
  },

  createExam: async (data: any) => {
    return apiClient.post('/mock-exams/', data);
  },

  updateExam: async (id: number, data: any) => {
    return apiClient.patch(`/mock-exams/${id}/`, data);
  },

  getExam: async (id: number) => {
    return apiClient.get(`/mock-exams/${id}/`);
  },

  startExam: async (id: number) => {
    return apiClient.post(`/mock-exams/${id}/start/`);
  },

  getExamSections: async (id: number) => {
    return apiClient.get(`/mock-exams/${id}/sections/`);
  },

  submitSection: async (id: number, data: { section: string; answers: Record<string, string>; time_spent_seconds: number }) => {
    return apiClient.post(`/mock-exams/${id}/submit_section/`, data);
  },

  submitExam: async (id: number) => {
    return apiClient.post(`/mock-exams/${id}/submit_exam/`);
  },

  getMyAttempts: async () => {
    return apiClient.get('/mock-exam-attempts/my_attempts/');
  },

  getAttempt: async (id: number) => {
    return apiClient.get(`/mock-exam-attempts/${id}/`);
  },

  getExamStatistics: async () => {
    return apiClient.get('/mock-exams/stats/');
  },

  // Bluebook-specific API methods
  getExamAnalytics: async (examId: number) => {
    return apiClient.get(`/mock-exams/${examId}/analytics/`);
  },

  getPerformanceTrends: async (params?: { time_range?: string; exam_type?: string }) => {
    return apiClient.get('/mock-exams/performance_trends/', { params });
  },

  getWeakAreasAnalysis: async (examId?: number) => {
    const url = examId ? `/mock-exams/${examId}/weak_areas/` : '/mock-exams/weak_areas/';
    return apiClient.get(url);
  },

  getComparativeAnalysis: async (examId: number) => {
    return apiClient.get(`/mock-exams/${examId}/comparative_analysis/`);
  },

  getScorePrediction: async (examId: number) => {
    return apiClient.get(`/mock-exams/${examId}/score_prediction/`);
  },

  saveQuestionResponse: async (examId: number, data: {
    question_id: number;
    answer: string;
    time_spent_seconds: number;
    marked_for_review?: boolean;
  }) => {
    return apiClient.post(`/mock-exams/${examId}/save_response/`, data);
  },

  getRemainingTime: async (examId: number) => {
    return apiClient.get(`/mock-exams/${examId}/remaining_time/`);
  },

  pauseExam: async (examId: number) => {
    return apiClient.post(`/mock-exams/${examId}/pause/`);
  },

  resumeExam: async (examId: number) => {
    return apiClient.post(`/mock-exams/${examId}/resume/`);
  },

  getAdaptiveRecommendations: async (examId: number) => {
    return apiClient.get(`/mock-exams/${examId}/adaptive_recommendations/`);
  },

  exportResults: async (examId: number, format: 'pdf' | 'json' = 'pdf') => {
    return apiClient.get(`/mock-exams/${examId}/export/`, {
      params: { format },
      responseType: 'blob'
    });
  },
};

// Flashcards API methods
export const flashcardsApi = {
  getFlashcards: async (params?: {
    subject?: string;
    difficulty?: string;
    search?: string;
    limit?: number;
  }) => {
    return apiClient.get('/flashcards/', { params });
  },

  getFlashcard: async (id: number) => {
    return apiClient.get(`/flashcards/${id}/`);
  },

  createFlashcard: async (data: any) => {
    return apiClient.post('/flashcards/', data);
  },

  updateFlashcard: async (id: number, data: any) => {
    return apiClient.patch(`/flashcards/${id}/`, data);
  },

  deleteFlashcard: async (id: number) => {
    return apiClient.delete(`/flashcards/${id}/`);
  },

  getProgress: async () => {
    return apiClient.get('/flashcards/progress/');
  },

  getNextReview: async () => {
    return apiClient.get('/flashcards/review/next/');
  },

  updateProgress: async (id: number, data: {
    is_correct: boolean;
    time_taken_seconds: number;
  }) => {
    return apiClient.post(`/flashcards/${id}/progress/`, data);
  },

  getReviewSession: async () => {
    return apiClient.get('/flashcards/review/');
  },
};

// Rankings API methods
export const rankingsApi = {
  getLeaderboard: async (params?: { period_type?: string; limit?: number }) => {
    return apiClient.get('/rankings/leaderboard/', { params });
  },

  getMyRankings: async () => {
    return apiClient.get('/rankings/my_rankings/');
  },

  getRankingStats: async (params?: { period_type?: string }) => {
    return apiClient.get('/rankings/stats/', { params });
  },

  updateRankings: async (data: { period_type: string; force_recalculate?: boolean }) => {
    return apiClient.post('/rankings/update_rankings/', data);
  },

  getRankingHistory: async (params?: { student_id?: string; period_type?: string; limit?: number }) => {
    return apiClient.get('/rankings/history/', { params });
  },

  getTopPerformers: async (params?: { period_type?: string; count?: number }) => {
    return apiClient.get('/rankings/top_performers/', { params });
  },
};

// Duplicated analyticsApi removed from here

// Utility functions
export const setAuthTokens = (tokens: { access: string; refresh: string }) => {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// Error handling
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;

    // Handle field-specific errors
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      if (typeof dataObj.detail === 'string') {
        return dataObj.detail;
      }

      // Handle validation errors
      const errors = Object.values(dataObj).flat();
      if (errors.length > 0 && typeof errors[0] === 'string') {
        return errors[0];
      }
    }

    return 'An error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Network error occurred';
};

// Notifications API methods
export const notificationsApi = {
  getNotifications: async (params?: { is_read?: boolean }) => {
    return apiClient.get('/notifications/', { params });
  },
  markRead: async (id: number) => {
    return apiClient.post(`/notifications/${id}/mark_read/`);
  },
  markAllRead: async () => {
    return apiClient.post('/notifications/mark_all_read/');
  },
  getUnreadCount: async () => {
    return apiClient.get('/notifications/unread_count/');
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health/');
    return true;
  } catch {
    return false;
  }
};

export default api;
