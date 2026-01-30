// User Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  invitation_code?: string;
  phone_number?: string;
  date_of_birth?: string;
  grade_level?: number;
  target_sat_score?: number;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: number;
  user: number;
  target_sat_score: number;
  sat_exam_date: string;
  study_hours_per_day: number;
  weak_subjects: string[];
  preferred_study_times: string[];
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: number;
  code: string;
  invited_by: number;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  is_used: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Class Types
export interface Class {
  id: number;
  name: string;
  description: string;
  teacher: number;
  students: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassLeaderboard {
  student: User;
  total_points: number;
  weekly_points: number;
  rank: number;
  weekly_rank: number;
}

// Homework Types
export interface Homework {
  id: number;
  title: string;
  description: string;
  class_obj: number;
  assigned_by: number;
  due_date: string;
  is_published: boolean;
  total_questions: number;
  difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
  created_at: string;
  updated_at: string;
}

export interface HomeworkSubmission {
  id: number;
  homework: number;
  student: number;
  submitted_at: string;
  score: number;
  max_score: number;
  is_late: boolean;
  answers: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Question Bank Types
export interface Question {
  id: number;
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'TEXT' | 'MATH';
  subject: 'MATH' | 'READING' | 'WRITING';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correct_answer: string;
  explanation: string;
  options?: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface QuestionAttempt {
  id: number;
  question: number;
  student: number;
  selected_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
  attempt_type: 'PRACTICE' | 'HOMEWORK' | 'MOCK_EXAM';
  created_at: string;
}

// Mock Exam Types
export interface MockExam {
  id: number;
  title: string;
  description: string;
  exam_type: 'FULL' | 'MATH' | 'READING' | 'WRITING';
  total_questions: number;
  time_limit_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockExamAttempt {
  id: number;
  mock_exam: number;
  student: number;
  started_at: string;
  submitted_at?: string;
  is_completed: boolean;
  sat_score: number;
  math_score: number;
  reading_writing_score: number;
  section_scores: Record<string, number>;
  created_at: string;
  updated_at: string;
}

// Flashcard Types
export interface Flashcard {
  id: number;
  word: string;
  definition: string;
  pronunciation?: string;
  example_sentence: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subject: 'MATH' | 'READING' | 'WRITING';
  created_at: string;
  updated_at: string;
}

export interface FlashcardProgress {
  id: number;
  flashcard: number;
  student: number;
  easiness_factor: number;
  repetition_count: number;
  interval_days: number;
  next_review_date: string;
  last_reviewed_at?: string;
  is_mastered: boolean;
  created_at: string;
  updated_at: string;
}

// Rankings Types
export interface Ranking {
  id: number;
  student: number;
  period_type: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  points: number;
  rank: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  student: User;
  points: number;
  rank: number;
  period_type: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  trend: 'up' | 'down' | 'stable';
}

// Analytics Types
export interface StudentProgress {
  id: number;
  student: number;
  date: string;
  homework_completed: number;
  homework_total: number;
  homework_completion_rate: number;
  homework_accuracy: number;
  mock_exams_taken: number;
  latest_sat_score: number;
  average_sat_score: number;
  flashcards_mastered: number;
  flashcards_total: number;
  study_time_minutes: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface WeakArea {
  id: number;
  student: number;
  subject: string;
  subcategory: string;
  accuracy_rate: number;
  total_attempts: number;
  improvement_suggestion: string;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: number;
  student: number;
  session_type: 'HOMEWORK' | 'MOCK_EXAM' | 'FLASHCARDS' | 'QUESTION_PRACTICE' | 'REVIEW';
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  questions_attempted: number;
  questions_correct: number;
  flashcards_reviewed: number;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  invitation_code: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// Form Types
export interface FormErrors {
  [key: string]: string[];
}

export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}

// Chart Data Types
export interface ProgressChartData {
  date: string;
  homework_completion: number;
  sat_score: number;
  study_time: number;
  flashcard_mastery: number;
}

export interface SubjectPerformance {
  subject: string;
  accuracy: number;
  total_questions: number;
  improvement: number;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
