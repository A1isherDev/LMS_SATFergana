// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    REFRESH: '/auth/refresh/',
    VERIFY: '/auth/verify/',
  },
  
  // Users
  USERS: {
    ME: '/users/me/',
    PROFILE: '/users/profile/',
    INVITATIONS: '/users/invitations/',
  },
  
  // Classes
  CLASSES: {
    LIST: '/classes/',
    DETAIL: (id: string) => `/classes/${id}/`,
    LEADERBOARD: (id: string) => `/classes/${id}/leaderboard/`,
  },
  
  // Homework
  HOMEWORK: {
    LIST: '/homework/',
    DETAIL: (id: string) => `/homework/${id}/`,
    SUBMISSIONS: (id: string) => `/homework/${id}/submissions/`,
    MY_SUBMISSIONS: '/homework/my_submissions/',
  },
  
  // Question Bank
  QUESTION_BANK: {
    QUESTIONS: '/questionbank/questions/',
    ATTEMPTS: '/questionbank/attempts/',
    MY_ATTEMPTS: '/questionbank/my_attempts/',
  },
  
  // Mock Exams
  MOCK_EXAMS: {
    LIST: '/mock-exams/',
    DETAIL: (id: string) => `/mock-exams/${id}/`,
    ATTEMPTS: '/mock-exam-attempts/',
    MY_ATTEMPTS: '/mock-exam-attempts/',
    START: (id: string) => `/mock-exams/${id}/start/`,
    SUBMIT: (id: string) => `/mock-exams/${id}/submit/`,
  },
  
  // Flashcards
  FLASHCARDS: {
    LIST: '/flashcards/',
    DETAIL: (id: string) => `/flashcards/${id}/`,
    PROGRESS: '/flashcards/progress/',
    REVIEW: '/flashcards/review/',
    REVIEW_NEXT: '/flashcards/review/next/',
    UPDATE_PROGRESS: (id: string) => `/flashcards/${id}/progress/`,
  },
  
  // Rankings
  RANKINGS: {
    LEADERBOARD: '/rankings/leaderboard/',
    MY_RANKINGS: '/rankings/my_rankings/',
    STATS: '/rankings/stats/',
    UPDATE_RANKINGS: '/rankings/update_rankings/',
    HISTORY: '/rankings/history/',
    TOP_PERFORMERS: '/rankings/top_performers/',
  },
  
  // Analytics
  ANALYTICS: {
    PROGRESS: '/analytics/progress/',
    MY_PROGRESS: '/analytics/progress/my_progress/',
    PROGRESS_CHART: '/analytics/progress/progress_chart/',
    WEAK_AREAS: '/analytics/weak_areas/',
    MY_WEAK_AREAS: '/analytics/weak_areas/my_weak_areas/',
    STUDY_SESSIONS: '/analytics/study_sessions/',
    MY_SESSIONS: '/analytics/study_sessions/my_sessions/',
    STUDENT_SUMMARY: '/analytics/student_summary/',
    CLASS_ANALYTICS: (id: string) => `/analytics/class_analytics/${id}/`,
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
