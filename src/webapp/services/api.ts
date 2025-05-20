/**
 * Client-side API service for making requests to the backend
 */

// Get the base URL for API requests from environment variables
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
};

// API error class
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Helper function to make authenticated API requests
const authenticatedRequest = async (
  url: string,
  method: string,
  accessToken: string,
  body?: any
) => {
  try {
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `Request failed with status ${response.status}`,
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("An error occurred during the request", 500);
  }
};

// Auth service
export const authService = {
  /**
   * Initiate login with Bluesky handle
   */
  initiateLogin: async (handle: string): Promise<{ authUrl: string }> => {
    if (!handle) {
      throw new ApiError("Handle is required", 400);
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      const url = `${apiBaseUrl}/api/users/login?handle=${handle}`;
      console.log("Initiating login with URL:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || "Failed to initiate login",
          response.status
        );
      }

      return data;
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
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(
        `${apiBaseUrl}/api/users/oauth/callback?code=${code}&state=${state}&iss=${iss}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || "Authentication failed",
          response.status
        );
      }

      return data;
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
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || "Failed to fetch user data",
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Get user error:", error);
      throw new ApiError("An error occurred while fetching user data", 500);
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

// Annotation service
export const annotationService = {
  /**
   * Create and publish an annotation template
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
  ): Promise<{ templateId: string }> => {
    const apiBaseUrl = getApiBaseUrl();
    return authenticatedRequest(
      `${apiBaseUrl}/api/annotations/templates`,
      "POST",
      accessToken,
      templateData
    );
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
  ): Promise<{ annotationIds: string[] }> => {
    const apiBaseUrl = getApiBaseUrl();
    return authenticatedRequest(
      `${apiBaseUrl}/api/annotations/from-template`,
      "POST",
      accessToken,
      annotationData
    );
  },

  /**
   * Get templates created by the current user
   */
  getTemplates: async (
    accessToken: string
  ): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      createdAt: string;
      fieldCount: number;
    }>
  > => {
    const apiBaseUrl = getApiBaseUrl();
    return authenticatedRequest(
      `${apiBaseUrl}/api/annotations/templates`,
      "GET",
      accessToken
    );
  },

  /**
   * Get a specific template by ID
   */
  getTemplateById: async (
    accessToken: string,
    templateId: string
  ): Promise<{
    id: string;
    name: string;
    description: string;
    fields: Array<{
      id: string;
      name: string;
      description: string;
      definitionType: string;
      definition: any;
      required: boolean;
    }>;
    createdAt: string;
    curatorId: string;
  }> => {
    const apiBaseUrl = getApiBaseUrl();
    return authenticatedRequest(
      `${apiBaseUrl}/api/annotations/templates/${templateId}`,
      "GET",
      accessToken
    );
  },

  /**
   * Get annotations created by the current user
   */
  getMyAnnotations: async (
    accessToken: string
  ): Promise<
    Array<{
      id: string;
      url: string;
      fieldName: string;
      valueType: string;
      valuePreview: string;
      createdAt: string;
      templateName?: string;
    }>
  > => {
    const apiBaseUrl = getApiBaseUrl();
    return authenticatedRequest(
      `${apiBaseUrl}/api/annotations/my-annotations`,
      "GET",
      accessToken
    );
  },
};
