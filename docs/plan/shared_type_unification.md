# Shared Type Unification Plan - DDD-Aligned Implementation

## Executive Summary

This document provides a comprehensive implementation plan for sharing types between the backend and frontend using npm workspaces. The approach balances DDD/layered architecture principles with pragmatic simplicity for a startup codebase.

## Current State Analysis

### What Exists Today

**Backend DTOs** (`src/modules/cards/application/dtos/`):
- `UserProfileDTO`, `UrlCardDTO`, `NoteCardDTO`, `CollectionDTO`
- `PaginationDTO`, `CardSortingDTO`, `CollectionSortingDTO`
- `FeedItemDTO`
- These are used as return types from Use Cases

**Frontend Types** (`src/webapp/api-client/types/`):
- `requests.ts` - Request parameter interfaces
- `responses.ts` - Response type interfaces (User, UrlCard, Collection, etc.)
- Nearly identical to backend DTOs (already unified in recent work)

**Current Flow**:
```
Domain Model → Use Case (returns DTO) → Controller (returns DTO as-is) → Frontend (expects matching type)
```

### The Problem

1. **Duplication**: Same types exist in backend DTOs and frontend response types
2. **Drift Risk**: Changes must be manually synchronized between backend and frontend
3. **No Validation**: Controllers accept `any` types, then use cases validate

## Architectural Philosophy

### DDD Layered Architecture Review

**Classic DDD Layers:**
1. **Domain Layer**: Entities, Value Objects, Domain Services, Domain Events
2. **Application Layer**: Use Cases, DTOs, Application Services
3. **Infrastructure Layer**: Controllers, Repositories, External Services
4. **Presentation Layer**: UI Components, API Clients

### Where Types Belong

**Traditional DDD Approach:**
- DTOs live in **Application Layer** (Use Case outputs)
- DTOs define contract between Use Case and Controller
- DTOs should NOT be directly exposed to external consumers
- Controllers map DTOs to HTTP response formats

**Pragmatic Reality for Startups:**
- Maintaining separate DTO and HTTP response types is overhead
- For simple CRUD APIs, DTOs ≈ HTTP responses is acceptable
- The key is being **intentional** about this choice

### Our Approach: Pragmatic DDD

We'll create **shared API contract types** that serve dual purposes:
1. Use Case output types (replacing current DTOs)
2. HTTP API contract types (replacing frontend response types)

This is a pragmatic simplification that:
- ✅ Eliminates duplication
- ✅ Maintains type safety
- ✅ Keeps code simple
- ⚠️ Slightly blurs application/infrastructure boundary (acceptable tradeoff)

## Validation Strategy in DDD

### Three Levels of Validation

#### 1. Controller-Level Validation (Infrastructure Layer)
**Purpose**: Validate HTTP request structure and types
**Implementation**: Use Zod schemas at controller entry points
**Examples**:
- Is `url` parameter present and a string?
- Is `page` a positive integer?
- Are required fields in request body present?

**Where**: `src/modules/*/infrastructure/http/controllers/*`

```typescript
// Example: GetCollectionsForUrlController.ts
import { z } from 'zod';

const querySchema = z.object({
  url: z.string().url(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'cardCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

async executeImpl(req: Request, res: Response) {
  const validationResult = querySchema.safeParse(req.query);
  if (!validationResult.success) {
    return this.badRequest(res, validationResult.error.message);
  }

  const query = validationResult.data;
  // Pass validated data to use case...
}
```

#### 2. Use Case-Level Validation (Application Layer)
**Purpose**: Validate business rules and create domain objects
**Implementation**: Use domain value objects (already doing this!)
**Examples**:
- `URL.create(query.url)` - validates URL format using domain rules
- `CardId.createFromString(id)` - validates ID format
- Business logic validation (e.g., "user can only have 50 collections")

**Where**: `src/modules/*/application/useCases/*`

This layer is **already correct** in the codebase!

#### 3. Domain-Level Validation (Domain Layer)
**Purpose**: Enforce invariants and domain rules
**Implementation**: Value Objects and Entity constructors
**Examples**:
- `URL` value object validates URL format
- `CollectionName` might enforce length limits
- `Email` value object validates email format

**Where**: `src/modules/*/domain/value-objects/*`, entities

This layer is **already correct** in the codebase!

### Validation Summary

**Current state**: ✅ Good DDD validation (levels 2 & 3 already implemented)
**What we'll add**: Level 1 (Zod schemas at controllers) for better error messages

## Proposed Architecture

### Directory Structure

```
semble/
├── package.json                          # Root workspace config
├── src/
│   ├── types/                           # @semble/types package (NEW)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── common.ts           # User, Pagination, Sorting
│   │   │   │   ├── requests.ts         # Request types
│   │   │   │   ├── responses.ts        # Response types
│   │   │   │   ├── index.ts            # Re-exports
│   │   │   └── index.ts                # Main entry
│   │   └── dist/                       # Compiled output
│   │
│   ├── modules/
│   │   ├── cards/
│   │   │   ├── domain/                 # Keep domain layer pure
│   │   │   ├── application/
│   │   │   │   ├── useCases/
│   │   │   │   │   └── queries/
│   │   │   │   │       └── GetCollectionsForUrlUseCase.ts
│   │   │   │   │           # Now returns @semble/types
│   │   │   │   └── dtos/              # REMOVE (replaced by @semble/types)
│   │   │   └── infrastructure/
│   │   │       └── http/
│   │   │           └── controllers/    # Add Zod validation
│   │   │               └── GetCollectionsForUrlController.ts
│   │   └── feeds/
│   │       └── ... (similar structure)
│   │
│   ├── webapp/
│   │   ├── package.json                # Adds @semble/types dependency
│   │   └── api-client/
│   │       ├── ApiClient.ts            # Imports @semble/types
│   │       └── types/                  # REMOVE (replaced by @semble/types)
│   │
│   └── shared/                         # Keep existing backend shared utils
```

### Type Organization

**`src/types/src/api/common.ts`** - Shared domain concepts:
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

export interface FeedPagination extends Pagination {
  nextCursor?: string;
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

**`src/types/src/api/requests.ts`** - API request types:
```typescript
// Base interfaces
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortingParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Query parameter interfaces
export interface GetCollectionsForUrlParams extends PaginationParams, SortingParams {
  url: string;
}

// Command request interfaces
export interface AddUrlToLibraryRequest {
  url: string;
  note?: string;
  collectionIds?: string[];
}

// ... etc
```

**`src/types/src/api/responses.ts`** - API response types:
```typescript
import { User, Pagination, CardSorting, CollectionSorting } from './common';

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

export interface Collection {
  id: string;
  uri?: string;
  name: string;
  author: User;
  description?: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetCollectionsForUrlResponse {
  collections: Collection[];
  pagination: Pagination;
  sorting: CollectionSorting;
}

// ... etc
```

## Implementation Plan

### Phase 0: Prerequisites

**Install Zod for validation:**
```bash
npm install zod
```

### Phase 1: Create Shared Types Package (Infrastructure)

#### 1.1 Configure Workspace Root

Update `package.json`:
```json
{
  "name": "semble",
  "workspaces": [
    "src/types",
    "src/webapp"
  ],
  "scripts": {
    "build:types": "npm run build --workspace=@semble/types",
    "dev:types": "npm run dev --workspace=@semble/types",
    "type-check": "tsc --noEmit && npm run type-check --workspace=@semble/webapp"
  }
}
```

#### 1.2 Create Types Package

Create `src/types/package.json`:
```json
{
  "name": "@semble/types",
  "version": "1.0.0",
  "description": "Shared TypeScript types for Semble API",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist/**/*"],
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

#### 1.3 Copy Types from Frontend

1. Copy content from `src/webapp/api-client/types/` to `src/types/src/api/`
2. Organize into `common.ts`, `requests.ts`, `responses.ts`
3. Create index files for re-exports
4. Build: `cd src/types && npm run build`

### Phase 2: Update Backend to Use Shared Types

#### 2.1 Add Dependency

Update root `package.json`:
```json
{
  "dependencies": {
    "@semble/types": "workspace:*",
    "zod": "^3.22.4"
  }
}
```

Run `npm install`

#### 2.2 Update Use Cases

**Example: `GetCollectionsForUrlUseCase.ts`**

Before:
```typescript
import { CollectionDTO, PaginationDTO, CollectionSortingDTO } from '../../dtos';

export interface GetCollectionsForUrlResult {
  collections: CollectionDTO[];
  pagination: PaginationDTO;
  sorting: CollectionSortingDTO;
}
```

After:
```typescript
import { GetCollectionsForUrlResponse } from '@semble/types';

// Use the shared type directly as the return type
export type GetCollectionsForUrlResult = GetCollectionsForUrlResponse;

// Or inline it:
async execute(query: GetCollectionsForUrlQuery): Promise<Result<GetCollectionsForUrlResponse>> {
  // ... implementation returns GetCollectionsForUrlResponse
}
```

#### 2.3 Update Controllers with Validation

**Example: `GetCollectionsForUrlController.ts`**

Before:
```typescript
async executeImpl(req: Request, res: Response): Promise<any> {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return this.badRequest(res, 'URL query parameter is required');
  }
  // ...
}
```

After:
```typescript
import { z } from 'zod';
import { GetCollectionsForUrlParams, GetCollectionsForUrlResponse } from '@semble/types';

// Define validation schema
const querySchema = z.object({
  url: z.string().min(1, 'URL is required'),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'cardCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

async executeImpl(req: Request, res: Response): Promise<any> {
  // Validate request
  const validation = querySchema.safeParse(req.query);
  if (!validation.success) {
    return this.badRequest(res, validation.error.format());
  }

  const params: GetCollectionsForUrlParams = validation.data;

  const result = await this.getCollectionsForUrlUseCase.execute({
    url: params.url,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy as CollectionSortField | undefined,
    sortOrder: params.sortOrder as SortOrder | undefined,
  });

  if (result.isErr()) {
    return this.fail(res, result.error);
  }

  // result.value is GetCollectionsForUrlResponse
  return this.ok<GetCollectionsForUrlResponse>(res, result.value);
}
```

#### 2.4 Remove Old DTOs

Once all use cases and controllers are updated:
```bash
rm -rf src/modules/cards/application/dtos/
rm -rf src/modules/user/application/dtos/
```

### Phase 3: Update Frontend to Use Shared Types

#### 3.1 Add Dependency

Update `src/webapp/package.json`:
```json
{
  "dependencies": {
    "@semble/types": "workspace:*"
  }
}
```

Run `npm install`

#### 3.2 Update ApiClient

**`src/webapp/api-client/ApiClient.ts`**

Before:
```typescript
import type {
  GetCollectionsForUrlParams,
  GetCollectionsForUrlResponse,
} from './types';
```

After:
```typescript
import type {
  GetCollectionsForUrlParams,
  GetCollectionsForUrlResponse,
} from '@semble/types';
```

#### 3.3 Remove Old Types

```bash
rm -rf src/webapp/api-client/types/
```

### Phase 4: Development Workflow Setup

#### 4.1 Add Development Scripts

Update root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:types\" \"npm run dev:webapp\" \"npm run dev:backend\"",
    "dev:types": "npm run dev --workspace=@semble/types",
    "dev:webapp": "npm run dev --workspace=@semble/webapp",
    "dev:backend": "npm run dev:app:inner",
    "build:all": "npm run build:types && npm run build && npm run build:webapp",
    "type-check": "tsc --noEmit && npm run type-check --workspace=@semble/webapp"
  }
}
```

#### 4.2 Update Backend tsconfig.json

Ensure backend can resolve workspace packages:
```json
{
  "compilerOptions": {
    "paths": {
      "@semble/types": ["./src/types/src"]
    }
  }
}
```

### Phase 5: Testing & Validation

#### 5.1 Type Checking
```bash
npm run type-check        # Check backend
npm run type-check --workspace=@semble/webapp  # Check frontend
```

#### 5.2 Build Everything
```bash
npm run build:all
```

#### 5.3 Runtime Testing
- Start dev servers: `npm run dev`
- Test each modified endpoint
- Verify request validation works (try invalid requests)
- Verify responses match expected types

## Migration Checklist

### Phase 1: Shared Types Package ✅
- [ ] Update root `package.json` with workspaces configuration
- [ ] Create `src/types/package.json`
- [ ] Create `src/types/tsconfig.json`
- [ ] Create `src/types/src/api/common.ts` (copy from webapp)
- [ ] Create `src/types/src/api/requests.ts` (copy from webapp)
- [ ] Create `src/types/src/api/responses.ts` (copy from webapp)
- [ ] Create `src/types/src/api/index.ts` (re-exports)
- [ ] Create `src/types/src/index.ts` (main entry)
- [ ] Build types: `cd src/types && npm install && npm run build`
- [ ] Verify build output in `src/types/dist/`

### Phase 2: Backend Migration ✅
- [ ] Install zod: `npm install zod`
- [ ] Add `@semble/types` to root dependencies
- [ ] Run `npm install` to link workspace
- [ ] Update backend tsconfig.json with paths
- [ ] For each module (cards, feeds, user):
  - [ ] Update use case imports (replace DTO imports with @semble/types)
  - [ ] Update use case return types to use shared types
  - [ ] Update controller imports
  - [ ] Add Zod validation schemas to controllers
  - [ ] Update controller methods to use validated params
  - [ ] Type controller responses
- [ ] Remove `src/modules/*/application/dtos/` directories
- [ ] Run type check: `npm run type-check`
- [ ] Fix any type errors

### Phase 3: Frontend Migration ✅
- [ ] Add `@semble/types` to `src/webapp/package.json`
- [ ] Run `npm install` in webapp
- [ ] Update `src/webapp/api-client/ApiClient.ts` imports
- [ ] Update all client files in `src/webapp/api-client/clients/`
- [ ] Remove `src/webapp/api-client/types/` directory
- [ ] Update any UI components that imported from old types
- [ ] Run type check: `npm run type-check --workspace=@semble/webapp`
- [ ] Fix any type errors

### Phase 4: Development Workflow ✅
- [ ] Add dev scripts to root package.json
- [ ] Test concurrent development: `npm run dev`
- [ ] Make a test change to shared types
- [ ] Verify hot reload works in both backend and frontend
- [ ] Test build pipeline: `npm run build:all`

### Phase 5: Testing ✅
- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] Manual testing of key endpoints:
  - [ ] GET /api/cards/collections/for-url
  - [ ] GET /api/cards/my-cards
  - [ ] GET /api/feed/global
  - [ ] POST /api/cards/library/url
  - [ ] POST /api/collections
- [ ] Test request validation (submit invalid requests)
- [ ] Verify error messages are helpful

## Files to Modify

### High Priority (Core Queries)

**Use Cases:**
- `src/modules/cards/application/useCases/queries/GetCollectionsForUrlUseCase.ts`
- `src/modules/cards/application/useCases/queries/GetCollectionsUseCase.ts`
- `src/modules/cards/application/useCases/queries/GetLibrariesForCardUseCase.ts`
- `src/modules/cards/application/useCases/queries/GetLibrariesForUrlUseCase.ts`
- `src/modules/cards/application/useCases/queries/GetNoteCardsForUrlUseCase.ts`
- `src/modules/cards/application/useCases/queries/GetUrlCardViewUseCase.ts`
- `src/modules/cards/application/useCases/queries/GetUrlStatusForMyLibraryUseCase.ts`
- `src/modules/feeds/application/useCases/queries/GetGlobalFeedUseCase.ts`

**Controllers:**
- All controllers in `src/modules/cards/infrastructure/http/controllers/`
- `src/modules/feeds/infrastructure/http/controllers/GetGlobalFeedController.ts`

**Frontend:**
- `src/webapp/api-client/ApiClient.ts`
- All files in `src/webapp/api-client/clients/`

### Medium Priority (Commands)

**Use Cases:**
- `src/modules/cards/application/useCases/commands/AddUrlToLibraryUseCase.ts`
- `src/modules/cards/application/useCases/commands/CreateCollectionUseCase.ts`
- ... (other command use cases)

### Lower Priority

- UI components that reference types directly
- Test files
- Documentation

## Best Practices

### Type Naming Conventions
- **Requests**: `{Verb}{Resource}Request` (e.g., `AddUrlToLibraryRequest`)
- **Params**: `Get{Resource}Params` (e.g., `GetCollectionsForUrlParams`)
- **Responses**: `{Verb}{Resource}Response` (e.g., `GetCollectionsForUrlResponse`)
- **Common**: Descriptive nouns (e.g., `User`, `Pagination`, `Collection`)

### Validation Patterns

**Controller validation (structure & types):**
```typescript
const schema = z.object({
  requiredString: z.string().min(1),
  optionalNumber: z.coerce.number().optional(),
  enum: z.enum(['option1', 'option2']),
});

const result = schema.safeParse(req.body);
if (!result.success) {
  return this.badRequest(res, result.error.format());
}
```

**Use case validation (business rules):**
```typescript
const urlResult = URL.create(params.url);
if (urlResult.isErr()) {
  return err(new ValidationError(`Invalid URL: ${urlResult.error.message}`));
}
```

### Development Workflow
1. **Always run types in watch mode** during development: `npm run dev:types`
2. **Make type changes first** before implementing features
3. **Type-check frequently**: `npm run type-check`
4. **Test request validation** with invalid inputs

## Pragmatic Simplifications

### What We're NOT Doing (And Why That's OK)

❌ **Separate DTOs and API types**:
- Reason: For this codebase, they're effectively the same
- Tradeoff: Slightly impure DDD, but significantly simpler

❌ **Runtime validation of responses**:
- Reason: TypeScript compilation guarantees response shape
- Tradeoff: Could add Zod validation of Use Case outputs, but not needed initially

❌ **OpenAPI schema generation**:
- Reason: Can add later if needed
- Benefit: Shared types make this easier in the future

❌ **Separate versioning of types package**:
- Reason: Monorepo with synchronized deploys
- Note: Could add semantic versioning later if needed

### What Makes This "Barebones But Reliable"

✅ **Single source of truth**: Types defined once, used everywhere
✅ **Compile-time safety**: TypeScript catches mismatches immediately
✅ **Runtime validation**: Zod at boundaries catches bad requests
✅ **Simple workflow**: Edit types, both sides update automatically
✅ **Standard tooling**: npm workspaces (not custom build scripts)

## Troubleshooting

### "Cannot find module '@semble/types'"
```bash
# From root
npm install
cd src/types && npm run build
```

### Types package not updating
```bash
# Restart types watch mode
npm run dev:types
```

### Import path errors in IDE
- Restart TypeScript server in your IDE
- Check `tsconfig.json` paths configuration
- Verify `node_modules/@semble/types` symlink exists

### Validation errors not showing
- Check Zod schema matches the expected request shape
- Use `.safeParse()` not `.parse()` to get detailed errors
- Log `validation.error.format()` for debugging

## Future Enhancements

### Short Term
- [ ] Add Zod schemas for all controllers
- [ ] Create shared Zod utilities for common patterns (pagination, sorting)
- [ ] Add request/response logging middleware

### Medium Term
- [ ] Generate OpenAPI spec from shared types
- [ ] Create API documentation from types
- [ ] Add integration tests using shared types
- [ ] Create type-safe test factories

### Long Term
- [ ] Publish types package to private npm registry
- [ ] Implement breaking change detection (type diff checks)
- [ ] Add runtime response validation in development mode
- [ ] Generate client SDKs for mobile apps

## DDD Architecture Notes

### What We Preserved
- ✅ Domain layer remains pure (no external dependencies)
- ✅ Use cases validate using domain value objects
- ✅ Domain-driven validation hierarchy (domain → application → infrastructure)
- ✅ Clear boundaries between layers

### Pragmatic Compromises
- ⚠️ Shared types blur application/infrastructure boundary
- ⚠️ Use cases return types designed for HTTP responses
- ✅ But: This is **intentional** and **documented**

### Why This Is OK for a Startup
1. **Velocity**: Eliminates significant boilerplate
2. **Type Safety**: Maintains compile-time guarantees
3. **Maintainability**: Single source of truth reduces bugs
4. **Scalability**: Can refactor later if needed (types are internal contract)

The key is being **intentional** about the tradeoff rather than accidentally coupling layers.

---

## Appendix: Example Migration

### Before: GetCollectionsForUrlUseCase

```typescript
// src/modules/cards/application/dtos/CollectionDTO.ts
export interface CollectionDTO {
  id: string;
  uri?: string;
  name: string;
  author: UserProfileDTO;
  description?: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

// src/modules/cards/application/useCases/queries/GetCollectionsForUrlUseCase.ts
import { CollectionDTO, PaginationDTO, CollectionSortingDTO } from '../../dtos';

export interface GetCollectionsForUrlResult {
  collections: CollectionDTO[];
  pagination: PaginationDTO;
  sorting: CollectionSortingDTO;
}

export class GetCollectionsForUrlUseCase {
  async execute(query: GetCollectionsForUrlQuery): Promise<Result<GetCollectionsForUrlResult>> {
    // ... implementation
  }
}

// src/modules/cards/infrastructure/http/controllers/GetCollectionsForUrlController.ts
export class GetCollectionsForUrlController extends Controller {
  async executeImpl(req: Request, res: Response): Promise<any> {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return this.badRequest(res, 'URL query parameter is required');
    }

    const result = await this.useCase.execute({ url });
    if (result.isErr()) {
      return this.fail(res, result.error);
    }
    return this.ok(res, result.value);
  }
}

// src/webapp/api-client/types/responses.ts
export interface Collection {
  id: string;
  uri?: string;
  name: string;
  author: User;
  description?: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetCollectionsForUrlResponse {
  collections: Collection[];
  pagination: Pagination;
  sorting: CollectionSorting;
}

// src/webapp/api-client/ApiClient.ts
import { GetCollectionsForUrlResponse } from './types';

async getCollectionsForUrl(params): Promise<GetCollectionsForUrlResponse> {
  // ...
}
```

### After: With Shared Types

```typescript
// src/types/src/api/responses.ts
export interface Collection {
  id: string;
  uri?: string;
  name: string;
  author: User;
  description?: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetCollectionsForUrlResponse {
  collections: Collection[];
  pagination: Pagination;
  sorting: CollectionSorting;
}

// src/modules/cards/application/useCases/queries/GetCollectionsForUrlUseCase.ts
import { GetCollectionsForUrlResponse } from '@semble/types';

export class GetCollectionsForUrlUseCase {
  async execute(
    query: GetCollectionsForUrlQuery
  ): Promise<Result<GetCollectionsForUrlResponse>> {
    // ... implementation returns GetCollectionsForUrlResponse
  }
}

// src/modules/cards/infrastructure/http/controllers/GetCollectionsForUrlController.ts
import { z } from 'zod';
import {
  GetCollectionsForUrlParams,
  GetCollectionsForUrlResponse
} from '@semble/types';

const querySchema = z.object({
  url: z.string().min(1),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'cardCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export class GetCollectionsForUrlController extends Controller {
  async executeImpl(req: Request, res: Response): Promise<any> {
    const validation = querySchema.safeParse(req.query);
    if (!validation.success) {
      return this.badRequest(res, validation.error.format());
    }

    const result = await this.useCase.execute({
      url: validation.data.url,
      page: validation.data.page,
      limit: validation.data.limit,
      sortBy: validation.data.sortBy as CollectionSortField | undefined,
      sortOrder: validation.data.sortOrder as SortOrder | undefined,
    });

    if (result.isErr()) {
      return this.fail(res, result.error);
    }

    return this.ok<GetCollectionsForUrlResponse>(res, result.value);
  }
}

// src/webapp/api-client/ApiClient.ts
import { GetCollectionsForUrlResponse } from '@semble/types';

async getCollectionsForUrl(params): Promise<GetCollectionsForUrlResponse> {
  // ...
}
```

### Key Changes
1. ✅ Single `Collection` type (not duplicated)
2. ✅ Single `GetCollectionsForUrlResponse` type
3. ✅ Controller validates with Zod schema
4. ✅ Use case returns shared type
5. ✅ Frontend imports same types
6. ✅ Full type safety from DB to UI

---

## Summary

This plan provides a **pragmatic, DDD-aligned approach** to sharing types between backend and frontend:

- **Uses npm workspaces** for proper dependency management
- **Adds Zod validation** at controller boundaries
- **Preserves domain-driven validation** patterns
- **Eliminates type duplication** while maintaining type safety
- **Stays simple** and avoids overengineering

The result is a **barebones but reliable** type system that:
- Catches errors at compile time
- Validates requests at runtime
- Maintains a single source of truth
- Scales as the codebase grows

Your engineer should be able to follow this plan step-by-step to implement the shared type system successfully.
