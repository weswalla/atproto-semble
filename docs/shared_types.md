# Shared Types Architecture - npm Workspaces Implementation

This document outlines the implementation plan for sharing types between the backend (`src/`) and webapp (`src/webapp/`) using npm workspaces in our monorepo structure.

## Overview

We use npm workspaces to create a shared types package that both backend and frontend import from as a proper npm dependency, ensuring type safety and consistency across the entire application.

## Architecture Decision: npm Workspaces

We chose npm workspaces over simpler approaches because:

- ✅ **Industry standard** - Professional monorepo structure
- ✅ **Proper dependency management** - npm handles versioning and dependencies
- ✅ **Scalability** - Easy to add more packages (mobile app, CLI tools, etc.)
- ✅ **Build isolation** - Each package has its own build process
- ✅ **Publishing ready** - Can publish shared types as separate npm package
- ✅ **IDE support** - Better IntelliSense and go-to-definition
- ✅ **Version management** - Can version shared types independently

## Final Directory Structure

```
annos/
├── package.json                    # Workspace root
├── src/
│   ├── types/                     # @annos/types package
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── index.ts       # Re-exports all types
│   │   │   │   ├── common.ts      # Common types (User, Pagination, etc.)
│   │   │   │   ├── requests.ts    # Request types for all API endpoints
│   │   │   │   └── responses.ts   # Response types for all API endpoints
│   │   │   └── index.ts           # Main entry point
│   │   └── dist/                  # Compiled output
│   ├── shared/                    # EXISTING: Backend shared utilities
│   ├── modules/                   # Backend modules
│   └── webapp/
│       ├── package.json           # @annos/webapp package
│       └── ...
```

## Implementation Plan

### Phase 1: Setup Workspace Infrastructure

#### Step 1.1: Configure Root Workspace

Update root `package.json`:

```json
{
  "name": "annos",
  "version": "1.0.0",
  "workspaces": [
    "src/types",
    "src/webapp",
    "."
  ],
  "scripts": {
    "build:types": "npm run build --workspace=@annos/types",
    "dev:types": "npm run dev --workspace=@annos/types",
    "build:webapp": "npm run build --workspace=@annos/webapp",
    "dev:webapp": "npm run dev --workspace=@annos/webapp",
    "dev:all": "npm run dev:types & npm run dev:webapp & npm run dev:app:inner"
  }
}
```

#### Step 1.2: Create Shared Types Package

Create `src/types/package.json`:

```json
{
  "name": "@annos/types",
  "version": "1.0.0",
  "description": "Shared TypeScript types for Annos API",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

Create `src/types/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Step 1.3: Update Webapp Package

Update `src/webapp/package.json`:

```json
{
  "name": "@annos/webapp",
  "dependencies": {
    "@annos/types": "workspace:*",
    // ... existing dependencies
  }
}
```

### Phase 2: Migrate Types to Shared Package

#### Step 2.1: Create Shared Type Files

Move and organize existing webapp types into the shared package:

**src/types/src/api/common.ts:**
```typescript
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

export interface FeedPagination extends Pagination {
  nextCursor?: string;
}
```

**src/types/src/api/requests.ts:**
```typescript
// Copy all request types from src/webapp/api-client/types/requests.ts
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortingParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ... all other request types
```

**src/types/src/api/responses.ts:**
```typescript
import { User, Pagination, CardSorting, CollectionSorting, FeedPagination } from './common';

// Copy all response types from src/webapp/api-client/types/responses.ts
export interface UrlCard {
  id: string;
  type: 'URL';
  url: string;
  // ... rest of UrlCard interface
}

// ... all other response types
```

**src/types/src/api/index.ts:**
```typescript
export * from './common';
export * from './requests';
export * from './responses';
```

**src/types/src/index.ts:**
```typescript
export * from './api';
```

#### Step 2.2: Build Shared Types

```bash
cd src/types
npm run build
```

### Phase 3: Update Frontend to Use Shared Types

#### Step 3.1: Install Shared Types Dependency

```bash
npm install --workspace=@annos/webapp
```

#### Step 3.2: Update Frontend Imports

Replace all imports in webapp files:

```typescript
// OLD: src/webapp/api-client/ApiClient.ts
import type {
  GetUrlCardsResponse,
  AddUrlToLibraryRequest,
} from './types/responses';

// NEW:
import type {
  GetUrlCardsResponse,
  AddUrlToLibraryRequest,
} from '@annos/types';
```

#### Step 3.3: Remove Old Type Files

```bash
rm -rf src/webapp/api-client/types/
```

### Phase 4: Update Backend to Use Shared Types

#### Step 4.1: Install Shared Types in Backend

Add to root `package.json` dependencies:

```json
{
  "dependencies": {
    "@annos/types": "workspace:*"
  }
}
```

#### Step 4.2: Update Use Cases

```typescript
// src/modules/cards/application/useCases/queries/GetUrlCardsUseCase.ts
import { GetUrlCardsResponse } from '@annos/types';

export class GetUrlCardsUseCase {
  async execute(
    query: GetUrlCardsQuery
  ): Promise<Result<GetUrlCardsResponse, ValidationError | AppError.UnexpectedError>> {
    // Implementation must return GetUrlCardsResponse type
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

#### Step 4.3: Update Controllers

```typescript
// src/modules/cards/infrastructure/http/controllers/GetMyUrlCardsController.ts
import { GetUrlCardsResponse } from '@annos/types';

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

### Phase 5: Development Workflow

#### Step 5.1: Development Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:types\" \"npm run dev:webapp\" \"npm run dev:app:inner\"",
    "dev:types": "npm run dev --workspace=@annos/types",
    "build:all": "npm run build:types && npm run build:webapp && npm run build"
  }
}
```

#### Step 5.2: Type Development Workflow

1. **Make type changes** in `src/types/src/api/`
2. **Shared types auto-rebuild** (if using `npm run dev:types`)
3. **Both frontend and backend** get updated types automatically
4. **TypeScript compiler** catches any mismatches immediately

### Phase 6: Testing and Validation

#### Step 6.1: Type Safety Validation

```bash
# Check all TypeScript compilation
npm run type-check
npm run type-check --workspace=@annos/webapp
npm run build:types
```

#### Step 6.2: Runtime Validation (Optional)

Add Zod schemas for runtime validation:

**src/types/src/validation/index.ts:**
```typescript
import { z } from 'zod';

export const UrlCardSchema = z.object({
  id: z.string(),
  type: z.literal('URL'),
  url: z.string().url(),
  // ... other fields
});

export const GetUrlCardsResponseSchema = z.object({
  cards: z.array(UrlCardSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalCount: z.number(),
    hasMore: z.boolean(),
    limit: z.number(),
  }),
  sorting: z.object({
    sortBy: z.enum(['createdAt', 'updatedAt', 'libraryCount']),
    sortOrder: z.enum(['asc', 'desc']),
  }),
});
```

## Migration Checklist

### Phase 1: Infrastructure ✅
- [ ] Update root `package.json` with workspaces
- [ ] Create `src/types/package.json`
- [ ] Create `src/types/tsconfig.json`
- [ ] Update `src/webapp/package.json` dependencies
- [ ] Run `npm install` to setup workspace

### Phase 2: Type Migration ✅
- [ ] Create `src/types/src/api/common.ts`
- [ ] Create `src/types/src/api/requests.ts`
- [ ] Create `src/types/src/api/responses.ts`
- [ ] Create `src/types/src/api/index.ts`
- [ ] Create `src/types/src/index.ts`
- [ ] Build shared types: `npm run build:types`

### Phase 3: Frontend Migration ✅
- [ ] Update all imports in webapp to use `@annos/types`
- [ ] Remove old type files: `rm -rf src/webapp/api-client/types/`
- [ ] Test webapp compilation: `npm run type-check --workspace=@annos/webapp`

### Phase 4: Backend Migration ✅
- [ ] Add shared types dependency to root package
- [ ] Update use cases to import and return shared types
- [ ] Update controllers to use shared types
- [ ] Test backend compilation: `npm run type-check`

### Phase 5: Development Setup ✅
- [ ] Add development scripts to root package.json
- [ ] Test concurrent development: `npm run dev`
- [ ] Verify hot reload works for type changes

### Phase 6: Validation ✅
- [ ] Run full type check across all packages
- [ ] Test API endpoints return correct types
- [ ] Add runtime validation (optional)
- [ ] Update documentation

## Best Practices

### Type Naming Conventions
- **Requests**: `{Action}{Resource}Request` (e.g., `GetUrlCardsRequest`)
- **Responses**: `{Action}{Resource}Response` (e.g., `GetUrlCardsResponse`)
- **Common types**: Descriptive names (e.g., `User`, `Pagination`)

### Development Workflow
1. **Always run shared types in watch mode** during development
2. **Make type changes first** before implementing features
3. **Use TypeScript strict mode** to catch issues early
4. **Version shared types** when making breaking changes

### Error Handling
- Define consistent error response types
- Use discriminated unions for different error types
- Include error codes and messages in shared types

## Troubleshooting

### Common Issues

1. **"Cannot find module '@annos/types'"**
   - Run `npm install` in root to setup workspace links
   - Ensure shared types are built: `npm run build:types`

2. **Type mismatches between frontend and backend**
   - Check that both are using the same version of shared types
   - Rebuild shared types: `npm run build:types`

3. **Hot reload not working for type changes**
   - Ensure `npm run dev:types` is running in watch mode
   - Restart development servers if needed

### Debugging Tips

1. Use `npm ls @annos/types` to check workspace linking
2. Check `src/types/dist/` for compiled output
3. Use IDE "Go to Definition" to verify imports are resolving correctly

## Future Enhancements

- **OpenAPI generation**: Generate OpenAPI specs from shared types
- **Runtime validation**: Add Zod schemas for all shared types
- **Documentation**: Auto-generate API docs from types
- **Testing**: Create type-safe test utilities
- **Publishing**: Publish shared types to private npm registry
- **Versioning**: Implement semantic versioning for breaking changes
