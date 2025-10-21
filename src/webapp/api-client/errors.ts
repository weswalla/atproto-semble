// API error types for frontend client

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
