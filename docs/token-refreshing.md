# Token Refreshing Strategy

This document outlines our approach to automatic token refreshing with clean separation of concerns, combining proactive and reactive strategies to ensure seamless user experience with minimal API failures.

## Overview

Our token refresh strategy uses a **layered architecture** with clear separation of responsibilities:

1. **TokenManager**: Centralized token logic with automatic refresh
2. **Storage Abstraction**: Pluggable storage implementations for client/server
3. **Token Refresher**: Dedicated service for refresh API calls
4. **Proactive Refresh**: Automatically refresh tokens before they expire (every 5 minutes)
5. **Clean BaseClient**: Only handles HTTP requests, delegates token management

## Architecture

### 1. Core Interfaces

```typescript
// src/webapp/services/TokenManager.ts
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
  refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}
```

### 2. TokenManager - Central Token Logic

The `TokenManager` handles all token-related logic with automatic refresh:

```typescript
// src/webapp/services/TokenManager.ts
export class TokenManager {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(
    private storage: TokenStorage,
    private refresher: TokenRefresher,
  ) {}

  async getValidAccessToken(): Promise<string | null> {
    const { accessToken, refreshToken } = this.storage.getTokens();
    
    if (!accessToken) return null;
    
    // Check if token is expired or will expire soon
    if (this.isTokenExpired(accessToken, 2)) { // 2 minute buffer
      if (!refreshToken) {
        this.storage.clearTokens();
        return null;
      }
      
      const refreshed = await this.refreshIfNeeded();
      if (!refreshed) return null;
      
      // Get fresh token after refresh
      return this.storage.getTokens().accessToken;
    }
    
    return accessToken;
  }

  private async refreshIfNeeded(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise || false;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();
    
    try {
      return await this.refreshPromise;
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
      await this.storage.setTokens(newTokens.accessToken, newTokens.refreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.storage.clearTokens();
      return false;
    }
  }

  private isTokenExpired(token: string, bufferMinutes: number = 0): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const bufferTime = bufferMinutes * 60 * 1000;
      return Date.now() >= (expiry - bufferTime);
    } catch (e) {
      return true;
    }
  }
}
```

### 3. Storage Implementations

**Client-side storage** with localStorage and cookie sync:

```typescript
// src/webapp/services/storage/ClientTokenStorage.ts
export class ClientTokenStorage implements TokenStorage {
  getTokens(): AuthTokens {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }
    
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Sync with server cookies
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken }),
        credentials: 'include',
      });
    } catch (error) {
      console.warn('Failed to sync tokens with server:', error);
    }
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
```

**Server-side storage** (read-only from cookies):

```typescript
// src/webapp/services/storage/ServerTokenStorage.ts
export class ServerTokenStorage implements TokenStorage {
  constructor(private cookiesStore: any) {}

  getTokens(): AuthTokens {
    return {
      accessToken: this.cookiesStore.get('accessToken')?.value || null,
      refreshToken: this.cookiesStore.get('refreshToken')?.value || null,
    };
  }

  async setTokens(): Promise<void> {
    // Server-side can't set tokens - handled by client-side sync
    throw new Error('Server-side token refresh not supported');
  }

  clearTokens(): void {
    // Server-side can't clear tokens directly
    throw new Error('Server-side token clearing not supported');
  }
}
```

### 4. Token Refresher Service

```typescript
// src/webapp/services/TokenRefresher.ts
export class ApiTokenRefresher implements TokenRefresher {
  constructor(private baseUrl: string) {}

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }
}
```

### 5. Clean BaseClient

The `BaseClient` now only handles HTTP requests:

```typescript
// src/webapp/api-client/clients/BaseClient.ts
export abstract class BaseClient {
  constructor(
    protected baseUrl: string,
    protected tokenManager: TokenManager,
  ) {}

  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.tokenManager.getValidAccessToken();

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
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText || 'Unknown error' };
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

### 6. Factory Functions for Easy Setup

```typescript
// src/webapp/services/auth.ts
import { TokenManager } from './TokenManager';
import { ClientTokenStorage } from './storage/ClientTokenStorage';
import { ServerTokenStorage } from './storage/ServerTokenStorage';
import { ApiTokenRefresher } from './TokenRefresher';

// Client-side token manager
export const createClientTokenManager = () => {
  const storage = new ClientTokenStorage();
  const refresher = new ApiTokenRefresher(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
  );
  return new TokenManager(storage, refresher);
};

// Server-side token manager (read-only, no refresh capability)
export const createServerTokenManager = async () => {
  const { cookies } = await import('next/headers');
  const cookiesStore = await cookies();
  const storage = new ServerTokenStorage(cookiesStore);
  const refresher = new ApiTokenRefresher(''); // Won't be used
  return new TokenManager(storage, refresher);
};
```

### 7. Updated ApiClient

```typescript
// src/webapp/api-client/ApiClient.ts
export class ApiClient {
  constructor(
    private baseUrl: string,
    private tokenManager: TokenManager,
  ) {
    this.queryClient = new QueryClient(baseUrl, tokenManager);
    this.cardClient = new CardClient(baseUrl, tokenManager);
    this.collectionClient = new CollectionClient(baseUrl, tokenManager);
    this.userClient = new UserClient(baseUrl, tokenManager);
    this.feedClient = new FeedClient(baseUrl, tokenManager);
  }
  // ... rest stays the same
}

// Default client instances
export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  createClientTokenManager(),
);

export const createServerApiClient = async () => {
  const tokenManager = await createServerTokenManager();
  return new ApiClient(
    process.env.API_BASE_URL || 'http://localhost:3000',
    tokenManager,
  );
};
```

## Proactive Token Refresh

The **primary strategy** is proactive refresh in the auth hook:

```typescript
// src/webapp/hooks/useAuth.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ... existing state

  const tokenManager = useMemo(() => createClientTokenManager(), []);

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

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        // Token refresh is automatic!
        const response = await apiClient.getUrlCardView(cardId);
        setCard(response);
      } catch (error: any) {
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

  // ... rest of component
}
```

### Server Components

```typescript
// Server component usage
import { createServerApiClient } from '@/services/auth';

export default async function SSRProfilePage() {
  const apiClient = await createServerApiClient();
  
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

## Benefits of This Architecture

✅ **Single Responsibility**: Each class has one clear purpose  
✅ **Testable**: Easy to mock TokenStorage and TokenRefresher  
✅ **Flexible**: Different storage strategies for client/server  
✅ **Clean BaseClient**: Only handles HTTP requests  
✅ **Consistent API**: Same interface everywhere  
✅ **Future-proof**: Easy to add new storage backends  
✅ **Race Condition Safe**: TokenManager prevents concurrent refreshes  
✅ **Automatic Refresh**: Tokens refreshed before expiration  
✅ **Server-Side Support**: Works in SSR with cookie-based tokens  

## Server-Side Token Refresh Limitation

**Current Approach**: Server components use read-only token access from cookies. If tokens are expired, the request will fail gracefully.

**Why This Works**:
- Proactive refresh on client-side prevents most expiration scenarios
- Server components typically render fresh on each request
- Failed server requests degrade gracefully (show error states)
- Client-side components can still refresh and retry

**Future Enhancements** (if needed):
- Add middleware to check token expiry and redirect to refresh endpoint
- Implement server-side refresh with secure cookie updates
- Use hybrid approach with client-side refresh signals

## Token Timing Strategy

- **Access Token Lifetime**: 15 minutes (server-configured)
- **Proactive Refresh**: Every 5 minutes, refresh if expiring within 5 minutes
- **TokenManager Buffer**: 2-minute buffer for automatic refresh on API calls
- **Refresh Token Lifetime**: 7 days (server-configured)

This means:
- Tokens are refreshed at 10 minutes (5 minutes before 15-minute expiry)
- API calls get fresh tokens automatically (2-minute buffer)
- Users can be inactive for up to 7 days and still auto-login

## Implementation Checklist

- [ ] Create `TokenManager` class with refresh logic
- [ ] Implement `ClientTokenStorage` and `ServerTokenStorage`
- [ ] Create `ApiTokenRefresher` service
- [ ] Update `BaseClient` to use `TokenManager`
- [ ] Update `ApiClient` constructor
- [ ] Create factory functions in auth service
- [ ] Enhance `useAuth` hook with proactive refresh
- [ ] Create default `apiClient` export
- [ ] Update components to use default `apiClient`
- [ ] Test token refresh scenarios
- [ ] Monitor refresh frequency in production

## Monitoring

Consider tracking these metrics:
- Proactive refresh frequency (should be regular)
- TokenManager refresh calls (should be rare due to proactive refresh)
- Failed refresh attempts (should investigate)
- Average time between refreshes (should be ~5 minutes)
- Token refresh success rate (should be >99%)

## Migration Guide

### From Old Approach

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

1. **TokenManager**: Centralized token logic replaces scattered refresh code
2. **Storage Abstraction**: Pluggable storage for different environments
3. **Clean BaseClient**: Only handles HTTP, delegates token management
4. **Factory Functions**: Easy setup for client/server scenarios
5. **Default Export**: Use `apiClient` instead of creating instances
