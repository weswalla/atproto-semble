import { ApiError, ApiErrorResponse } from '../errors';

const ENABLE_REFRESH_LOGGING = true;

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
      if (
        error instanceof ApiError &&
        error.statusCode === 401 &&
        retryCount === 0
      ) {
        // Try to refresh token and retry once
        await this.handleAuthError(url);
        return this.request(method, endpoint, data, 1);
      }
      throw error;
    }
  }

  private async handleAuthError(originalUrl?: string): Promise<void> {
    if (ENABLE_REFRESH_LOGGING) {
      const urlInfo = originalUrl ? ` for request to ${originalUrl}` : '';
      console.log(`[BaseClient] 401 error detected${urlInfo}, attempting token refresh`);
    }

    // Prevent concurrent refresh attempts
    if (!BaseClient.refreshPromise) {
      BaseClient.refreshPromise = this.performTokenRefresh();
    }

    try {
      await BaseClient.refreshPromise;
      if (ENABLE_REFRESH_LOGGING) {
        console.log(`[BaseClient] Token refresh completed successfully`);
      }
    } catch (error) {
      if (ENABLE_REFRESH_LOGGING) {
        console.log(`[BaseClient] Token refresh failed: ${error}`);
      }
      throw error;
    } finally {
      BaseClient.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4000';
    
    if (ENABLE_REFRESH_LOGGING) {
      console.log(`[BaseClient] Sending refresh request to ${appUrl}/api/auth/me`);
    }

    const response = await fetch(`${appUrl}/api/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (ENABLE_REFRESH_LOGGING) {
        console.log(`[BaseClient] Refresh request failed with status: ${response.status}`);
      }
      // Refresh failed, redirect to login if on client
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Token refresh failed');
    }

    if (ENABLE_REFRESH_LOGGING) {
      console.log(`[BaseClient] Refresh request successful`);
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
