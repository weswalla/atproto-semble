import { ApiError, ApiErrorResponse } from '../types/errors';
import { TokenManager } from '../../services/TokenManager';

export abstract class BaseClient {
  constructor(
    protected baseUrl: string,
    protected tokenManager?: TokenManager,
  ) {}

  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseUrl}${endpoint}`;
      const token = this.tokenManager
        ? await this.tokenManager.getAccessToken()
        : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method,
        headers,
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
      // Handle 401/403 errors with automatic token refresh (only if we have a token manager)
      if (
        this.tokenManager &&
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return this.tokenManager.handleAuthError(makeRequest);
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
