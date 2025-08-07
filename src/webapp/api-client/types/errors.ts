// Error types
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
