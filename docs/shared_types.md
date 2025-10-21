# Shared Types Architecture

This document outlines the recommended approach for sharing types between the backend (`src/`) and webapp (`src/webapp/`) in our monorepo structure.

## Overview

We use a shared API types directory that both backend and frontend import from, ensuring type safety and consistency across the entire application.

## Directory Structure

```
src/
├── shared/
│   └── api/
│       ├── requests.ts      # Request types for all API endpoints
│       ├── responses.ts     # Response types for all API endpoints
│       ├── common.ts        # Common types (User, Pagination, etc.)
│       └── index.ts         # Re-exports all types
├── modules/                 # Backend modules
└── webapp/                  # Frontend application
```

## Benefits

- ✅ **Zero additional tooling** - just TypeScript imports
- ✅ **Compile-time safety** - type mismatches caught immediately
- ✅ **Single source of truth** - one place to update API contracts
- ✅ **Easy refactoring** - TypeScript will catch all references
- ✅ **No build complexity** - works with existing setup
- ✅ **Monorepo friendly** - leverages existing structure

## Implementation Guide

### 1. Create Shared Types Directory

```bash
mkdir -p src/shared/api
```

### 2. Define Common Types

```typescript
// src/shared/api/common.ts
export interface User {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  description?: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
}

export interface BaseSorting {
  sortOrder: 'asc' | 'desc';
}

export interface CardSorting extends BaseSorting {
  sortBy: 'createdAt' | 'updatedAt' | 'libraryCount';
}

export interface CollectionSorting extends BaseSorting {
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'cardCount';
}
```

### 3. Define Request Types

```typescript
// src/shared/api/requests.ts
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortingParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetMyUrlCardsRequest extends PaginationParams, SortingParams {}

export interface AddUrlToLibraryRequest {
  url: string;
  note?: string;
  collectionIds?: string[];
}

// ... other request types
```

### 4. Define Response Types

```typescript
// src/shared/api/responses.ts
import { User, Pagination, CardSorting } from './common';

export interface UrlCard {
  id: string;
  type: 'URL';
  url: string;
  cardContent: {
    url: string;
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  urlLibraryCount: number;
  urlInLibrary?: boolean;
  createdAt: string;
  updatedAt: string;
  author: User;
  note?: {
    id: string;
    text: string;
  };
}

export interface GetUrlCardsResponse {
  cards: UrlCard[];
  pagination: Pagination;
  sorting: CardSorting;
}

// ... other response types
```

### 5. Create Index File

```typescript
// src/shared/api/index.ts
export * from './common';
export * from './requests';
export * from './responses';
```

### 6. Update Backend Use Cases

```typescript
// src/modules/cards/application/useCases/queries/GetUrlCardsUseCase.ts
import { GetUrlCardsResponse } from '../../../../shared/api';

export class GetUrlCardsUseCase {
  async execute(
    query: GetUrlCardsQuery,
  ): Promise<
    Result<GetUrlCardsResponse, ValidationError | AppError.UnexpectedError>
  > {
    // Implementation returns GetUrlCardsResponse type
    return ok({
      cards: enrichedCards,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.totalCount / limit),
        totalCount: result.totalCount,
        hasMore: page * limit < result.totalCount,
        limit,
      },
      sorting: {
        sortBy,
        sortOrder,
      },
    });
  }
}
```

### 7. Update Controllers

```typescript
// src/modules/cards/infrastructure/http/controllers/GetMyUrlCardsController.ts
import { GetUrlCardsResponse } from '../../../../shared/api';

export class GetMyUrlCardsController extends Controller {
  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    const result = await this.getUrlCardsUseCase.execute(query);

    if (result.isErr()) {
      return this.fail(res, result.error);
    }

    // result.value is GetUrlCardsResponse type - guaranteed by TypeScript
    return this.ok(res, result.value);
  }
}
```

### 8. Update Frontend API Client

```typescript
// src/webapp/api-client/ApiClient.ts
import type {
  GetUrlCardsResponse,
  GetMyUrlCardsRequest,
  AddUrlToLibraryRequest,
  AddUrlToLibraryResponse,
  // ... other types
} from '../../shared/api';

export class ApiClient {
  async getMyUrlCards(
    params?: GetMyUrlCardsRequest,
  ): Promise<GetUrlCardsResponse> {
    return this.queryClient.getMyUrlCards(params);
  }

  async addUrlToLibrary(
    request: AddUrlToLibraryRequest,
  ): Promise<AddUrlToLibraryResponse> {
    return this.cardClient.addUrlToLibrary(request);
  }
}
```

## Migration Strategy

### Phase 1: Setup Infrastructure

1. Create `src/shared/api/` directory structure
2. Move existing webapp types to shared location
3. Update webapp imports to use shared types

### Phase 2: Backend Integration (Per Endpoint)

For each API endpoint:

1. **Identify the endpoint** (e.g., `GET /api/cards/my`)
2. **Update use case** to return shared response type
3. **Update controller** to use shared types
4. **Test the endpoint** to ensure types match

### Phase 3: Validation (Optional)

Add runtime validation using libraries like Zod:

```typescript
// src/shared/api/validation.ts
import { z } from 'zod';

export const UrlCardSchema = z.object({
  id: z.string(),
  type: z.literal('URL'),
  url: z.string().url(),
  // ... other fields
});

export const GetUrlCardsResponseSchema = z.object({
  cards: z.array(UrlCardSchema),
  pagination: PaginationSchema,
  sorting: CardSortingSchema,
});
```

## Example: Complete Flow

Here's how a complete request/response flow works:

1. **Frontend makes request:**

```typescript
const response: GetUrlCardsResponse = await apiClient.getMyUrlCards({
  page: 1,
  limit: 20,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
});
```

2. **Controller receives request:**

```typescript
// TypeScript ensures the response matches GetUrlCardsResponse
const result = await this.useCase.execute(query);
return this.ok(res, result.value); // result.value is GetUrlCardsResponse
```

3. **Use case returns typed response:**

```typescript
// Return type is enforced by TypeScript
return ok({
  cards: [...],
  pagination: {...},
  sorting: {...}
}); // Must match GetUrlCardsResponse exactly
```

## Best Practices

### Type Naming Conventions

- **Requests**: `{Action}{Resource}Request` (e.g., `GetUrlCardsRequest`)
- **Responses**: `{Action}{Resource}Response` (e.g., `GetUrlCardsResponse`)
- **Common types**: Descriptive names (e.g., `User`, `Pagination`)

### File Organization

- Keep related types together in the same file
- Use barrel exports (`index.ts`) for clean imports
- Separate common types from endpoint-specific types

### Error Handling

- Define error response types consistently
- Use discriminated unions for different error types
- Include error codes and messages in shared types

### Versioning

- Consider API versioning in type names if needed
- Use semantic versioning for breaking changes
- Document breaking changes in migration guides

## Troubleshooting

### Common Issues

1. **Import path errors**: Ensure relative paths are correct
2. **Circular dependencies**: Keep shared types pure (no business logic)
3. **Type mismatches**: Use TypeScript strict mode to catch issues early

### Debugging Tips

1. Use `tsc --noEmit` to check types without building
2. Enable strict TypeScript settings in `tsconfig.json`
3. Use IDE features to trace type definitions

## Future Enhancements

- **OpenAPI generation**: Generate OpenAPI specs from shared types
- **Runtime validation**: Add Zod schemas for all shared types
- **Documentation**: Auto-generate API docs from types
- **Testing**: Create type-safe test utilities
