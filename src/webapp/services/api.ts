/**
 * Client-side API service for making requests to the backend
 * Now using ApiClient for all backend communication
 */
import {
  Template,
  TemplateDetail,
  Annotation,
  AnnotationDetail,
  CreateTemplateResponse,
  CreateAnnotationsResponse
} from "@/types/api";
import { ApiClient, ApiError } from "@/api-client/ApiClient";

// Get the base URL for API requests from environment variables
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
};

// Create a singleton API client instance for auth operations (no token needed)
const createAuthApiClient = () => {
  return new ApiClient(getApiBaseUrl(), () => null);
};

// Create an API client instance with auth token
const createAuthenticatedApiClient = (accessToken: string) => {
  return new ApiClient(getApiBaseUrl(), () => accessToken);
};

// Auth service using ApiClient
export const authService = {
  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    if (!refreshToken) {
      throw new ApiError("Refresh token is required", 400);
    }

    try {
      const apiClient = createAuthApiClient();
      return await apiClient.refreshAccessToken({ refreshToken });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Token refresh error:", error);
      throw new ApiError("An error occurred during token refresh", 500);
    }
  },

  /**
   * Initiate login with Bluesky handle
   */
  initiateLogin: async (handle: string): Promise<{ authUrl: string }> => {
    if (!handle) {
      throw new ApiError("Handle is required", 400);
    }

    try {
      const apiClient = createAuthApiClient();
      return await apiClient.initiateOAuthSignIn({ handle });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Login error:", error);
      throw new ApiError("An error occurred during login", 500);
    }
  },

  /**
   * Complete OAuth flow with code, state, and iss
   */
  completeOAuth: async (
    code: string,
    state: string,
    iss: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    if (!code || !state || !iss) {
      throw new ApiError("Code and state are required", 400);
    }

    try {
      const apiClient = createAuthApiClient();
      return await apiClient.completeOAuthSignIn({ code, state, iss });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("OAuth completion error:", error);
      throw new ApiError("An error occurred during authentication", 500);
    }
  },

  /**
   * Get current user data
   */
  getCurrentUser: async (accessToken: string): Promise<any> => {
    if (!accessToken) {
      throw new ApiError("Access token is required", 401);
    }

    try {
      const apiClient = createAuthenticatedApiClient(accessToken);
      return await apiClient.getMyProfile();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Get user error:", error);
      throw new ApiError("An error occurred while fetching user data", 500);
    }
  },

  /**
   * Logout user - Note: ApiClient doesn't have a logout method, keeping direct implementation
   */
  logout: async (refreshToken: string): Promise<void> => {
    if (!refreshToken) {
      return; // If no refresh token, just return
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new ApiError(data.message || "Logout failed", response.status);
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Don't throw on logout errors, just log them
    }
  },
};

// Annotation service using ApiClient
export const annotationService = {
  /**
   * Create and publish an annotation template
   * Note: This functionality may need to be added to ApiClient if not present
   */
  createTemplate: async (
    accessToken: string,
    templateData: {
      name: string;
      description: string;
      fields: Array<{
        name: string;
        description: string;
        type: string;
        definition: any;
        required: boolean;
      }>;
    }
  ): Promise<CreateTemplateResponse> => {
    // For now, keeping direct implementation since ApiClient may not have annotation methods
    const apiBaseUrl = getApiBaseUrl();
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiBaseUrl}/api/annotations/templates`, {
      method: "POST",
      headers,
      body: JSON.stringify(templateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  },

  /**
   * Create and publish annotations from a template
   */
  createAnnotationsFromTemplate: async (
    accessToken: string,
    annotationData: {
      url: string;
      templateId: string;
      annotations: Array<{
        annotationFieldId: string;
        type: string;
        value: any;
        note?: string;
      }>;
    }
  ): Promise<CreateAnnotationsResponse> => {
    // For now, keeping direct implementation since ApiClient may not have annotation methods
    const apiBaseUrl = getApiBaseUrl();
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiBaseUrl}/api/annotations/from-template`, {
      method: "POST",
      headers,
      body: JSON.stringify(annotationData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  },

  /**
   * Get templates created by the current user
   */
  getTemplates: async (
    accessToken: string
  ): Promise<Template[]> => {
    // For now, keeping direct implementation since ApiClient may not have annotation methods
    const apiBaseUrl = getApiBaseUrl();
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiBaseUrl}/api/annotations/templates`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  },

  /**
   * Get a specific template by ID
   */
  getTemplateById: async (
    accessToken: string,
    templateId: string
  ): Promise<TemplateDetail> => {
    // For now, keeping direct implementation since ApiClient may not have annotation methods
    const apiBaseUrl = getApiBaseUrl();
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiBaseUrl}/api/annotations/templates/${templateId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  },

  /**
   * Get annotations created by the current user
   */
  getMyAnnotations: async (
    accessToken: string
  ): Promise<Annotation[]> => {
    // For now, keeping direct implementation since ApiClient may not have annotation methods
    const apiBaseUrl = getApiBaseUrl();
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiBaseUrl}/api/annotations/my-annotations`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  },

  /**
   * Get a specific annotation by ID
   */
  getAnnotationById: async (
    accessToken: string,
    annotationId: string
  ): Promise<AnnotationDetail> => {
    // For now, keeping direct implementation since ApiClient may not have annotation methods
    const apiBaseUrl = getApiBaseUrl();
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiBaseUrl}/api/annotations/${annotationId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  },
};
