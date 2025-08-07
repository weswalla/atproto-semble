# API Client Architecture

This document outlines the recommended approach for creating an API client that abstracts away the details of interacting with the backend API.

## Recommended Approach: Separate Shared Package

Create a **separate npm package** (e.g., `@yourapp/api-client` or `@yourapp/shared`) that contains:

1. **API Client** - The abstraction layer with methods like `addUrlToLibrary()`
2. **Shared Types** - DTOs, response types, error types
3. **Type Guards/Validators** - Runtime type checking utilities

### Why This Approach?

**Pros:**

- **Single source of truth** for API contracts
- **Type safety** between frontend and backend
- **Reusable** across multiple frontends (web, mobile, etc.)
- **Versioned** - can manage API changes cleanly
- **Testable** in isolation

**Cons:**

- Additional build/publish complexity
- Need to manage package versioning

## Package Structure

```
packages/
├── api-client/
│   ├── src/
│   │   ├── client/
│   │   │   └── ApiClient.ts
│   │   ├── types/
│   │   │   ├── cards.ts
│   │   │   ├── collections.ts
│   │   │   └── common.ts
│   │   └── index.ts
│   └── package.json
├── backend/
└── frontend/
```

## Example API Client Structure

```typescript
// packages/api-client/src/types/cards.ts
export interface AddUrlToLibraryRequest {
  url: string;
  note?: string;
  collectionIds?: string[];
}

export interface AddUrlToLibraryResponse {
  urlCardId: string;
  noteCardId?: string;
}

// packages/api-client/src/client/ApiClient.ts
export class ApiClient {
  constructor(
    private baseUrl: string,
    private getAuthToken: () => string | null,
  ) {}

  async addUrlToLibrary(
    request: AddUrlToLibraryRequest,
  ): Promise<AddUrlToLibraryResponse> {
    const response = await this.post('/api/cards/library/urls', request);
    return response.json();
  }

  async createCollection(
    request: CreateCollectionRequest,
  ): Promise<CreateCollectionResponse> {
    const response = await this.post('/api/collections', request);
    return response.json();
  }

  private async post(endpoint: string, data: any) {
    const token = this.getAuthToken();
    return fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
  }
}
```

## Type Sharing Strategy

**Extract from your existing backend types:**

- Take the DTO interfaces from your use cases
- Create clean, frontend-friendly versions
- Add any additional client-side types needed

```typescript
// Extract these from your backend use cases:
export interface AddUrlToLibraryDTO {
  url: string;
  note?: string;
  collectionIds?: string[];
  curatorId: string; // This might be handled automatically by the client
}

// Transform to client-friendly version:
export interface AddUrlToLibraryRequest {
  url: string;
  note?: string;
  collectionIds?: string[];
  // curatorId removed - handled by auth
}
```

## Alternative Approaches

### 1. Frontend-Only Client

- Keep API client in frontend repo
- Duplicate types or use code generation
- Simpler but less maintainable

### 2. Backend Exports Client

- Export client from backend
- Frontend imports it
- Can work but creates coupling

### 3. Code Generation

- Generate client from OpenAPI spec
- Tools like `openapi-generator` or `swagger-codegen`
- Great for large APIs but adds complexity

## Implementation Steps

1. **Create the package structure**
2. **Extract and clean up types** from your use case DTOs
3. **Build the ApiClient class** with methods matching your endpoints
4. **Add error handling** and response transformation
5. **Set up build/publish pipeline**
6. **Update frontend to use the client**

## Error Handling Example

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// In ApiClient
private async handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || 'Request failed',
      response.status,
      error.code
    );
  }
  return response.json();
}
```

This approach gives you the best balance of maintainability, type safety, and reusability.
