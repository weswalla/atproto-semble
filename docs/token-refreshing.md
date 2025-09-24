# Token Refreshing Strategy

This document outlines our approach to automatic token refreshing, which combines proactive and reactive strategies to ensure seamless user experience with minimal API failures.

## Overview

Our token refresh strategy uses a **self-contained approach** with automatic retry:

1. **Proactive Refresh**: Automatically refresh tokens before they expire (every 5 minutes)
2. **Reactive Refresh**: Handle token refresh on API errors (401/403) automatically within BaseClient
3. **Request Queuing**: Queue failed requests during refresh to prevent data loss
4. **Race Condition Prevention**: Ensure only one refresh happens at a time
5. **Simplified API**: Single `getAuthTokens` callback provides both access and refresh tokens

## Architecture

### 1. Auth Service with Token Interface

The auth service provides a unified interface for token access:

```typescript
// src/webapp/services/auth.ts
export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export const getAuthTokens = (): AuthTokens => {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  };
};
```

### 2. Self-Contained BaseClient with Automatic Retry

The `BaseClient` handles token refresh internally without external dependencies:

```typescript
// src/webapp/api-client/clients/BaseClient.ts
import { ApiError, ApiErrorResponse } from '../types/errors';

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

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
    protected getAuthTokens: () => AuthTokens,
  ) {}

  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const makeRequest = async (): Promise<T> => {
      const url = `${this.baseUrl}${endpoint}`;
      const { accessToken } = this.getAuthTokens();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
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
      // Handle 401/403 errors with automatic token refresh
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
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
        this.refreshPromise = this.refreshTokensInternal();
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

  private async refreshTokensInternal(): Promise<boolean> {
    const { refreshToken } = this.getAuthTokens();
    
    if (!refreshToken) {
      return false;
    }

    try {
      // Make refresh request directly (avoid circular dependency)
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await response.json();

      // Update tokens in storage
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // Sync with server-side cookies
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        }),
        credentials: 'include',
      });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
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

### 3. Simplified ApiClient Constructor

```typescript
// src/webapp/api-client/ApiClient.ts
import { getAuthTokens } from '@/services/auth';

export class ApiClient {
  constructor(
    private baseUrl: string,
    private getAuthTokens: () => AuthTokens = getAuthTokens, // Default to global function
  ) {
    this.queryClient = new QueryClient(baseUrl, getAuthTokens);
    this.cardClient = new CardClient(baseUrl, getAuthTokens);
    this.collectionClient = new CollectionClient(baseUrl, getAuthTokens);
    this.userClient = new UserClient(baseUrl, getAuthTokens);
    this.feedClient = new FeedClient(baseUrl, getAuthTokens);
  }
  // ... rest stays the same
}
```

### 4. Default Export for Easy Usage

```typescript
// src/webapp/api-client/index.ts
import { ApiClient } from './ApiClient';

// Default configured client - no parameters needed!
export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
);

// Also export the class for custom instances
export { ApiClient };
export * from './types';
```

## Proactive Token Refresh

The **primary strategy** is proactive refresh to prevent token expiration:

### 5. Enhanced Auth Hook with Proactive Refresh

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

  // Simplified refresh function - uses default apiClient
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      handleLogout();
      return false;
    }

    try {
      // Use the default apiClient which handles refresh internally
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
        isAuthenticated,
        isLoading,
        accessToken,
        refreshToken,
        user,
        login,
        logout: handleLogout,
        // refreshTokens no longer needs to be exposed - handled internally
        setTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

## Usage Examples

### Client Components (Simplified)

```typescript
// src/webapp/app/(authenticated)/cards/[cardId]/page.tsx
'use client';

import { apiClient } from '@/api-client';

export default function CardPage() {
  const [card, setCard] = useState<GetUrlCardViewResponse | null>(null);
  // ... other state

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        // No need to create ApiClient or pass any functions!
        const response = await apiClient.getUrlCardView(cardId);
        setCard(response);
      } catch (error: any) {
        // Token refresh and retry is automatic
        console.error('Error fetching card:', error);
        setError(error.message || 'Failed to load card');
      } finally {
        setLoading(false);
      }
    };

    if (cardId) {
      fetchCard();
    }
  }, [cardId]);

  // ... rest of component stays the same
}
```

### Server Components

```typescript
// src/webapp/services/auth.ts - Add helper for server components
export const getServerAuthTokens = async (): Promise<AuthTokens> => {
  const { cookies } = await import('next/headers');
  const cookiesStore = await cookies();
  
  return {
    accessToken: cookiesStore.get('accessToken')?.value || null,
    refreshToken: cookiesStore.get('refreshToken')?.value || null,
  };
};

export const createServerApiClient = async () => {
  return new ApiClient(
    process.env.API_BASE_URL || 'http://localhost:3000',
    getServerAuthTokens,
  );
};
```

```typescript
// Server component usage
import { createServerApiClient } from '@/services/auth';

export default async function SSRProfilePage() {
  const apiClient = await createServerApiClient();
  
  // Server components get fresh tokens on each request
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

### Custom Usage

```typescript
// For custom instances with different configurations
const customClient = new ApiClient(
  'https://api.example.com',
  customGetAuthTokens, // Custom token provider
);

// Default usage - most common case
import { apiClient } from '@/api-client';
const cards = await apiClient.getMyUrlCards();
const profile = await apiClient.getMyProfile();
```

## How It Works

### Proactive Refresh (Primary Strategy)

1. **Every 5 minutes**, the auth hook checks if the access token will expire in the next 5 minutes
2. **If expiring soon**, it automatically refreshes the token in the background
3. **User never experiences** token expiration during normal usage
4. **New tokens are synced** to both localStorage and httpOnly cookies

### Reactive Refresh (Automatic Fallback)

1. **If proactive refresh fails** or user has been inactive, API calls might still get 401/403
2. **BaseClient automatically detects** these errors and triggers internal refresh
3. **Original request is queued** and retried after successful refresh
4. **Multiple concurrent requests** are handled gracefully with request queuing
5. **No external dependencies** - BaseClient handles everything internally

### Self-Contained Token Management

- **Single callback**: `getAuthTokens()` provides both access and refresh tokens
- **Internal refresh logic**: BaseClient handles token refresh without external functions
- **Automatic storage updates**: Refreshed tokens are automatically saved to localStorage and synced with cookies
- **Race condition safe**: Only one refresh operation can happen at a time

## Benefits

✅ **Seamless User Experience**: Users rarely see authentication errors  
✅ **Automatic Recovery**: Failed requests are automatically retried  
✅ **Race Condition Safe**: Prevents multiple simultaneous refresh attempts  
✅ **Request Queuing**: No lost requests during token refresh  
✅ **Zero Configuration**: Default `apiClient` works out of the box  
✅ **Self-Contained**: No need to pass refresh functions around  
✅ **Works Everywhere**: Both client and server components supported  
✅ **Graceful Degradation**: Automatic logout on refresh failure  
✅ **Clean Architecture**: Single responsibility for token management  
✅ **Easy Testing**: Mock `getAuthTokens` instead of multiple functions  

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

- [ ] Update `BaseClient` with internal refresh logic
- [ ] Update `ApiClient` constructor to use `getAuthTokens` callback
- [ ] Create `AuthTokens` interface in auth service
- [ ] Enhance `useAuth` hook with proactive refresh
- [ ] Create default `apiClient` export
- [ ] Update components to use default `apiClient`
- [ ] Create server API client helper with `getServerAuthTokens`
- [ ] Test token refresh scenarios
- [ ] Monitor refresh frequency in production

## Monitoring

Consider tracking these metrics:
- Proactive refresh frequency (should be regular)
- Reactive refresh frequency (should be rare)
- Failed refresh attempts (should investigate)
- Average time between refreshes (should be ~5 minutes)
- Token refresh success rate (should be >99%)

## Migration Guide

### From Old Approach (Multiple Callbacks)

**Before:**
```typescript
const apiClient = new ApiClient(
  baseUrl,
  () => getAccessToken(),
  refreshTokens, // Had to pass refresh function
);
```

**After:**
```typescript
import { apiClient } from '@/api-client';
// Just use the default instance - no configuration needed!
```

### Key Changes

1. **Single Callback**: Replace `getAuthToken` + `refreshTokens` with `getAuthTokens`
2. **Default Export**: Use `apiClient` instead of creating instances
3. **Internal Refresh**: BaseClient handles refresh internally
4. **Simplified Auth Hook**: No need to expose `refreshTokens`
5. **Server Components**: Use `getServerAuthTokens` for server-side token access
