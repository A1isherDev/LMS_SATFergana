import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Score formatting
export const formatScore = (score: number): string => {
  return score.toLocaleString();
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

// SAT Score utilities
export const getSatScoreColor = (score: number): string => {
  if (score >= 1400) return 'text-green-600';
  if (score >= 1200) return 'text-blue-600';
  if (score >= 1000) return 'text-yellow-600';
  return 'text-red-600';
};

export const getSatScoreLevel = (score: number): string => {
  if (score >= 1400) return 'Excellent';
  if (score >= 1200) return 'Good';
  if (score >= 1000) return 'Average';
  return 'Needs Improvement';
};

// Study streak utilities
export const getStreakColor = (days: number): string => {
  if (days >= 30) return 'text-purple-600';
  if (days >= 14) return 'text-blue-600';
  if (days >= 7) return 'text-green-600';
  if (days >= 3) return 'text-yellow-600';
  return 'text-gray-600';
};

export const getStreakMessage = (days: number): string => {
  if (days === 0) return 'Start your streak today!';
  if (days === 1) return 'Great start! Keep it going!';
  if (days < 7) return `${days} day streak! Building momentum!`;
  if (days < 14) return `${days} day streak! You're on fire!`;
  if (days < 30) return `${days} day streak! Incredible consistency!`;
  return `${days} day streak! You're a study legend!`;
};

// Time until exam utilities
export const getDaysUntilExam = (examDate: string): number => {
  const exam = new Date(examDate);
  const today = new Date();
  const diffTime = exam.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getExamUrgency = (days: number): { level: string; color: string } => {
  if (days <= 7) return { level: 'Critical', color: 'text-red-600' };
  if (days <= 30) return { level: 'High', color: 'text-orange-600' };
  if (days <= 90) return { level: 'Medium', color: 'text-yellow-600' };
  return { level: 'Low', color: 'text-green-600' };
};

// Subject utilities
export const getSubjectColor = (subject: string): string => {
  switch (subject) {
    case 'MATH':
      return 'bg-blue-100 text-blue-800';
    case 'READING':
      return 'bg-green-100 text-green-800';
    case 'WRITING':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'EASY':
      return 'bg-green-100 text-green-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'HARD':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
