/**
 * Client-side API service for making requests to the backend
 */

// Get the base URL for API requests from environment variables
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
};

// API error class
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Auth service
export const authService = {
  /**
   * Initiate login with Bluesky handle
   */
  initiateLogin: async (handle: string): Promise<{ authUrl: string }> => {
    if (!handle) {
      throw new ApiError('Handle is required', 400);
    }
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/users/login?handle=${handle}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(data.message || 'Failed to initiate login', response.status);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Login error:', error);
      throw new ApiError('An error occurred during login', 500);
    }
  },
  
  /**
   * Complete OAuth flow with code and state
   */
  completeOAuth: async (code: string, state: string): Promise<{ accessToken: string, refreshToken: string }> => {
    if (!code || !state) {
      throw new ApiError('Code and state are required', 400);
    }
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/users/oauth/callback?code=${code}&state=${state}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(data.message || 'Authentication failed', response.status);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('OAuth completion error:', error);
      throw new ApiError('An error occurred during authentication', 500);
    }
  },
  
  /**
   * Get current user data
   */
  getCurrentUser: async (accessToken: string): Promise<any> => {
    if (!accessToken) {
      throw new ApiError('Access token is required', 401);
    }
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(data.message || 'Failed to fetch user data', response.status);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Get user error:', error);
      throw new ApiError('An error occurred while fetching user data', 500);
    }
  },
  
  /**
   * Logout user
   */
  logout: async (refreshToken: string): Promise<void> => {
    if (!refreshToken) {
      return; // If no refresh token, just return
    }
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/users/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new ApiError(data.message || 'Logout failed', response.status);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw on logout errors, just log them
    }
  }
};
