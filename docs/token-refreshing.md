# Token Refreshing Strategy

This document outlines our approach to automatic token refreshing, which combines proactive and reactive strategies to ensure seamless user experience with minimal API failures.

## Overview

Our token refresh strategy uses a **proactive-first approach** with reactive fallback:

1. **Proactive Refresh**: Automatically refresh tokens before they expire (every 5 minutes)
2. **Reactive Refresh**: Handle token refresh on API errors (401/403) as a fallback
3. **Request Queuing**: Queue failed requests during refresh to prevent data loss
4. **Race Condition Prevention**: Ensure only one refresh happens at a time

## Architecture

### 1. Enhanced BaseClient with Automatic Retry

The `BaseClient` handles token refresh transparently for all API calls:

```typescript
// src/webapp/api-client/clients/BaseClient.ts
import { ApiError, ApiErrorResponse } from '../types/errors';

export abstract class BaseClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;
  private failedRequestsQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    request: () => Promise<any>;
  }> = [];

  constructor(
    protected baseUrl: string,
    protected getAuthToken: () => string | null,
    protected refreshTokens?: () => Promise<boolean>,
  ) {}

  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseUrl}${endpoint}`;
      const token = this.getAuthToken();

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

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);
      return this.handleResponse<T>(response);
    };

    try {
      return await makeRequest();
    } catch (error) {
      // Handle 401/403 errors with token refresh
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403) &&
        this.refreshTokens
      ) {
        return this.handleTokenRefreshAndRetry(makeRequest);
      }
      throw error;
    }
  }

  private async handleTokenRefreshAndRetry<T>(
    originalRequest: () => Promise<T>,
  ): Promise<T> {
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
        this.refreshPromise = this.refreshTokens!();
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
        
        const refreshError = new ApiError('Token refresh failed', 401);
        queuedRequests.forEach(({ reject }) => reject(refreshError));
        
        throw refreshError;
      }
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
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
```

### 2. Updated ApiClient Constructor

```typescript
// src/webapp/api-client/ApiClient.ts
export class ApiClient {
  constructor(
    private baseUrl: string,
    private getAuthToken: () => string | null,
    private refreshTokens?: () => Promise<boolean>, // Add refresh function
  ) {
    this.queryClient = new QueryClient(baseUrl, getAuthToken, refreshTokens);
    this.cardClient = new CardClient(baseUrl, getAuthToken, refreshTokens);
    this.collectionClient = new CollectionClient(baseUrl, getAuthToken, refreshTokens);
    this.userClient = new UserClient(baseUrl, getAuthToken, refreshTokens);
    this.feedClient = new FeedClient(baseUrl, getAuthToken, refreshTokens);
  }
  // ... rest stays the same
}
```

## Proactive Token Refresh

The **primary strategy** is proactive refresh to prevent token expiration:

### 3. Enhanced Auth Hook with Proactive Refresh

```typescript
// src/webapp/hooks/useAuth.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ... existing state

  // Helper function to check if a JWT token is expired or will expire soon
  const isTokenExpired = (token: string, bufferMinutes: number = 5): boolean => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      const bufferTime = bufferMinutes * 60 * 1000; // Buffer in milliseconds
      return Date.now() >= (expiry - bufferTime);
    } catch (e) {
      return true;
    }
  };

  // Improved refresh function with better error handling
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      handleLogout();
      return false;
    }

    try {
      const apiClient = createApiClient();
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await apiClient.refreshAccessToken({ refreshToken: currentRefreshToken });

      await setTokens(newAccessToken, newRefreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
      return false;
    }
  }, []);

  // PROACTIVE TOKEN REFRESH - This is the primary strategy
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    const checkAndRefreshToken = async () => {
      // Check if token will expire in the next 5 minutes
      if (isTokenExpired(accessToken, 5)) {
        console.log('Proactively refreshing token before expiration');
        await refreshTokens();
      }
    };

    // Check immediately on mount
    checkAndRefreshToken();
    
    // Then check every 5 minutes
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken, refreshTokens]);

  // ... rest of the provider

  return (
    <AuthContext.Provider
      value={{
        // ... existing values
        refreshTokens, // Make sure this is exposed for reactive refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

## Usage Examples

### Client Components

```typescript
// src/webapp/app/(authenticated)/cards/[cardId]/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function CardPage() {
  const { refreshTokens } = useAuth(); // Get refresh function from auth context
  const [card, setCard] = useState<GetUrlCardViewResponse | null>(null);
  // ... other state

  useEffect(() => {
    const apiClient = new ApiClient(
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      () => getAccessToken(),
      refreshTokens, // Pass refresh function - enables automatic retry on 401/403
    );

    const fetchCard = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getUrlCardView(cardId);
        setCard(response);
      } catch (error: any) {
        // Token refresh and retry is now automatic
        console.error('Error fetching card:', error);
        setError(error.message || 'Failed to load card');
      } finally {
        setLoading(false);
      }
    };

    if (cardId) {
      fetchCard();
    }
  }, [cardId, refreshTokens]);

  // ... rest of component stays the same
}
```

### Server Components

```typescript
// src/webapp/services/auth.ts - Add helper for server components
export const createServerApiClient = async () => {
  const accessToken = await getAccessTokenInServerComponent();
  
  return new ApiClient(
    process.env.API_BASE_URL || 'http://localhost:3000',
    () => accessToken,
    // No refresh function for server components - they get fresh tokens on each request
  );
};
```

```typescript
// Server component usage
import { createServerApiClient } from '@/services/auth';

export default async function SSRProfilePage() {
  const apiClient = await createServerApiClient();
  
  // Server components get fresh tokens on each request, so no refresh needed
  let profile;
  let error;

  try {
    profile = await apiClient.getMyProfile();
  } catch (err: any) {
    error = err.message || 'Failed to load profile';
  }

  // ... rest of component
}
```

## How It Works

### Proactive Refresh (Primary Strategy)

1. **Every 5 minutes**, the auth hook checks if the access token will expire in the next 5 minutes
2. **If expiring soon**, it automatically refreshes the token in the background
3. **User never experiences** token expiration during normal usage
4. **New tokens are synced** to both localStorage and httpOnly cookies

### Reactive Refresh (Fallback Strategy)

1. **If proactive refresh fails** or user has been inactive, API calls might still get 401/403
2. **BaseClient automatically detects** these errors and triggers refresh
3. **Original request is queued** and retried after successful refresh
4. **Multiple concurrent requests** are handled gracefully with request queuing

### Race Condition Prevention

- Only one refresh operation can happen at a time
- Concurrent API calls that fail are queued and retried together
- Prevents token refresh storms and ensures consistency

## Benefits

✅ **Seamless User Experience**: Users rarely see authentication errors  
✅ **Automatic Recovery**: Failed requests are automatically retried  
✅ **Race Condition Safe**: Prevents multiple simultaneous refresh attempts  
✅ **Request Queuing**: No lost requests during token refresh  
✅ **Minimal Code Changes**: Existing API calls work without modification  
✅ **Works Everywhere**: Both client and server components supported  
✅ **Graceful Degradation**: Automatic logout on refresh failure  

## Token Timing Strategy

- **Access Token Lifetime**: 15 minutes (server-configured)
- **Proactive Refresh**: Every 5 minutes, refresh if expiring within 5 minutes
- **Buffer Time**: 5-minute buffer ensures tokens are always fresh
- **Refresh Token Lifetime**: 7 days (server-configured)

This means:
- Tokens are refreshed at 10 minutes (5 minutes before 15-minute expiry)
- Users can be inactive for up to 7 days and still auto-login
- API calls should rarely encounter expired tokens due to proactive refresh

## Implementation Checklist

- [ ] Update `BaseClient` with retry logic
- [ ] Update `ApiClient` constructor to accept refresh function
- [ ] Enhance `useAuth` hook with proactive refresh
- [ ] Update client components to pass refresh function
- [ ] Create server API client helper
- [ ] Test token refresh scenarios
- [ ] Monitor refresh frequency in production

## Monitoring

Consider tracking these metrics:
- Proactive refresh frequency (should be regular)
- Reactive refresh frequency (should be rare)
- Failed refresh attempts (should investigate)
- Average time between refreshes (should be ~5 minutes)
