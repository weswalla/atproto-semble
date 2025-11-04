import { ApiError, ApiErrorResponse } from '../errors';

export abstract class BaseClient {
  private static refreshPromise: Promise<void> | null = null;

  constructor(protected baseUrl: string) {}

  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    retryCount = 0,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include cookies automatically (works for both client and server)
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401 && retryCount === 0) {
        // Try to refresh token and retry once
        await this.handleAuthError();
        return this.request(method, endpoint, data, 1);
      }
      throw error;
    }
  }

  private async handleAuthError(): Promise<void> {
    // Prevent concurrent refresh attempts
    if (!BaseClient.refreshPromise) {
      BaseClient.refreshPromise = this.performTokenRefresh();
    }
    
    try {
      await BaseClient.refreshPromise;
    } finally {
      BaseClient.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4000';
    const response = await fetch(`${appUrl}/api/auth/me`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      // Refresh failed, redirect to login if on client
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Token refresh failed');
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: ApiErrorResponse;

      try {
        errorData = await response.json();
      } catch {
        errorData = {
          message: response.statusText || 'Unknown error',
        };
      }

      throw new ApiError(
        errorData.message,
        response.status,
        errorData.code,
        errorData.details,
      );
    }

    return response.json();
  }
}
