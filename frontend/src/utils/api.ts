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
        if (refreshError && typeof refreshError === 'object' && 'response' in refreshError) {
          const response = (refreshError as any).response;
          if (response?.status === 401) {
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
  get: async <T>(url: string, params?: Record<string, any>): Promise<T> => {
    const response = await api.get<T>(url, { params });
    return response.data;
  },

  // POST requests
  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.post<T>(url, data);
    return response.data;
  },

  // PUT requests
  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.put<T>(url, data);
    return response.data;
  },

  // PATCH requests
  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.patch<T>(url, data);
    return response.data;
  },

  // DELETE requests
  delete: async <T>(url: string): Promise<T> => {
    const response = await api.delete<T>(url);
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
    return apiClient.get('/users/profile/');
  },

  updateProfile: async (data: any) => {
    return apiClient.patch('/users/me/', data);
  },
};

// Users API methods
export const usersApi = {
  getProfile: async () => {
    return apiClient.get('/users/profile/');
  },

  updateProfile: async (data: any) => {
    return apiClient.patch('/users/profile/', data);
  },

  getInvitations: async () => {
    return apiClient.get('/users/invitations/');
  },

  createInvitation: async (data: { email: string; role: string }) => {
    return apiClient.post('/users/invitations/', data);
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

  getClassLeaderboard: async (id: number) => {
    return apiClient.get(`/classes/${id}/leaderboard/`);
  },
};

// Homework API methods
export const homeworkApi = {
  getHomework: async (params?: { class?: number; status?: string }) => {
    return apiClient.get('/homework/', { params });
  },

  getStudentHomework: async () => {
    return apiClient.get('/homework/my_progress/');
  },

  getHomeworkDetail: async (id: number) => {
    return apiClient.get(`/homework/${id}/`);
  },

  createHomework: async (data: any) => {
    return apiClient.post('/homework/', data);
  },

  submitHomework: async (id: number, data: any) => {
    return apiClient.post(`/homework/${id}/submissions/`, data);
  },

  getMySubmissions: async () => {
    return apiClient.get('/homework/my_submissions/');
  },

  getSubmission: async (homeworkId: number, submissionId: number) => {
    return apiClient.get(`/homework/${homeworkId}/submissions/${submissionId}/`);
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

// Mock Exams API methods
export const mockExamsApi = {
  getExams: async () => {
    return apiClient.get('/mock-exams/');
  },

  getExam: async (id: number) => {
    return apiClient.get(`/mock-exams/${id}/`);
  },

  startExam: async (id: number) => {
    return apiClient.post(`/mock-exams/${id}/start/`);
  },

  submitExam: async (id: number, data: any) => {
    return apiClient.post(`/mock-exams/${id}/submit/`, data);
  },

  getMyAttempts: async () => {
    return apiClient.get('/mock-exam-attempts/');
  },

  getAttempt: async (id: number) => {
    return apiClient.get(`/mock-exam-attempts/${id}/`);
  },

  getExamStatistics: async () => {
    return apiClient.get('/mock-exams/statistics/');
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

// Analytics API methods
export const analyticsApi = {
  getMyProgress: async (params?: { start_date?: string; end_date?: string }) => {
    return apiClient.get('/analytics/progress/my_progress/', { params });
  },

  getProgressChart: async (params?: { period?: string; metric?: string }) => {
    return apiClient.get('/analytics/progress/progress_chart/', { params });
  },

  getMyWeakAreas: async () => {
    return apiClient.get('/analytics/weak_areas/my_weak_areas/');
  },

  getMySessions: async (params?: { start_date?: string; end_date?: string }) => {
    return apiClient.get('/analytics/study_sessions/my_sessions/', { params });
  },

  getStudentSummary: async () => {
    return apiClient.get('/analytics/student_summary/');
  },

  getClassAnalytics: async (classId: number) => {
    return apiClient.get(`/analytics/class_analytics/${classId}/`);
  },

  getDashboardStats: async () => {
    return apiClient.get('/dashboard/stats/');
  },

  startStudySession: async (sessionType: string = 'practice') => {
    return apiClient.post('/weak-areas/start_study_session/', { session_type: sessionType });
  },

  endStudySession: async (sessionId?: number) => {
    return apiClient.post('/weak-areas/end_study_session/', sessionId ? { session_id: sessionId } : {});
  },

  getActiveSession: async () => {
    return apiClient.get('/weak-areas/active_session/');
  },
};

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
export const handleApiError = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data;
    
    // Handle field-specific errors
    if (typeof data === 'object' && data !== null) {
      if (data.detail) {
        return data.detail;
      }
      
      // Handle validation errors
      const errors = Object.values(data).flat();
      if (errors.length > 0) {
        return errors[0] as string;
      }
    }
    
    return 'An error occurred';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Network error occurred';
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
