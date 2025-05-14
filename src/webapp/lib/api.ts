// API utility functions for making requests to the backend

/**
 * Get the base URL for API requests
 */
export const getApiBaseUrl = (): string => {
  // For client-side code, we need to use the Next.js public environment variables
  // which must be prefixed with NEXT_PUBLIC_
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
};

/**
 * Make a GET request to the API
 */
export const apiGet = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${getApiBaseUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

/**
 * Make a POST request to the API
 */
export const apiPost = async (endpoint: string, body: any, options: RequestInit = {}): Promise<any> => {
  const url = `${getApiBaseUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
    ...options,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};
