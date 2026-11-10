// API Configuration
// Use same-origin requests by default. Vercel serves the frontend and API
// together, while Vite proxies these paths to the local backend in development.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper function for API calls
export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data?.error || message;
    } catch {
      // Use the status message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response;
};
