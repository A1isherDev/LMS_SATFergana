// Helper function to fix dates in mock data
export const fixMockDates = (data: any): any => {
  const currentYear = new Date().getFullYear();
  const jsonString = JSON.stringify(data);
  
  // Replace all 2024 dates with 2025 dates
  const fixedJson = jsonString.replace(/2024-/g, `${currentYear}-`);
  
  return JSON.parse(fixedJson);
};

// Get current date in YYYY-MM-DD format
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get date X days from now
export const getFutureDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Get date X days ago
export const getPastDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};
