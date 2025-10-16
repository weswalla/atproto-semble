import { ApiError, ApiErrorResponse } from '../types/errors';
import { ClientCookieAuthService } from '@/services/auth';

export abstract class BaseClient {
  constructor(protected baseUrl: string) {}

  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseUrl}${endpoint}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const config: RequestInit = {
        method,
        headers,
        credentials: 'include', // Include cookies automatically (works for both client and server)
      };

      if (
        data &&
        (method === 'POST' || method === 'PUT' || method === 'PATCH')
      ) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);
      return this.handleResponse<T>(response);
    };

    try {
      return await makeRequest();
    } catch (error) {
      // Handle 401/403 errors with automatic token refresh (client-side only)
      if (
        typeof window !== 'undefined' &&
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        const refreshed = await ClientCookieAuthService.refreshTokens();
        if (refreshed) {
          return makeRequest(); // Retry with new tokens
        }
      }
      throw error;
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
