// API Configuration
// Use same-origin requests by default. Vercel serves the frontend and API
// together, while Vite proxies these paths to the local backend in development.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function for API calls
export const apiFetch = (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
};
