export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface TokenStorage {
  getTokens(): AuthTokens;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearTokens(): void;
}

export interface TokenRefresher {
  refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;
}

export class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private failedRequestsQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    request: () => Promise<any>;
  }> = [];

  constructor(
    private storage: TokenStorage,
    private refresher: TokenRefresher,
  ) {}

  async getAccessToken(): Promise<string | null> {
    const { accessToken } = this.storage.getTokens();
    return accessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    const { refreshToken } = this.storage.getTokens();
    return refreshToken;
  }

  async handleAuthError<T>(originalRequest: () => Promise<T>): Promise<T> {
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedRequestsQueue.push({
          resolve,
          reject,
          request: originalRequest,
        });
      });
    }

    // Start refresh process
    this.isRefreshing = true;

    try {
      // Use existing refresh promise or create new one
      if (!this.refreshPromise) {
        this.refreshPromise = this.performRefresh();
      }

      const refreshSuccess = await this.refreshPromise;

      if (refreshSuccess) {
        // Process queued requests
        const queuedRequests = [...this.failedRequestsQueue];
        this.failedRequestsQueue = [];

        // Retry all queued requests
        queuedRequests.forEach(async ({ resolve, reject, request }) => {
          try {
            const result = await request();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });

        // Retry original request
        return await originalRequest();
      } else {
        // Refresh failed, reject all queued requests
        const queuedRequests = [...this.failedRequestsQueue];
        this.failedRequestsQueue = [];

        const refreshError = new Error('Token refresh failed');
        queuedRequests.forEach(({ reject }) => reject(refreshError));

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw refreshError;
      }
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<boolean> {
    const { refreshToken } = this.storage.getTokens();
    if (!refreshToken) return false;

    try {
      const newTokens = await this.refresher.refreshTokens(refreshToken);
      await this.storage.setTokens(
        newTokens.accessToken,
        newTokens.refreshToken,
      );
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.storage.clearTokens();
      return false;
    }
  }
}
