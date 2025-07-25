# Collection Text Search Feature

## Overview
Enable text search over a user's collections so they can quickly find and select existing collections when adding cards.

## Implementation Options

Based on our CQRS and DDD architecture patterns, we have several strategic approaches:

### Option 1: Extend Existing Query Use Case (Recommended)
**Pattern**: Enhance `GetMyCollectionsUseCase` with search capability

**Pros**:
- Follows single responsibility - still "getting collections" 
- Reuses existing pagination, sorting, and enrichment logic
- Maintains consistent API surface
- Simpler client-side implementation

**Implementation**:
```typescript
// Update existing query interface
export interface GetMyCollectionsQuery {
  curatorId: string;
  page?: number;
  limit?: number;
  sortBy?: CollectionSortField;
  sortOrder?: SortOrder;
  searchText?: string; // NEW: Optional search parameter
}

// Update repository interface
export interface ICollectionQueryRepository {
  findByCreator(
    curatorId: string,
    options: CollectionQueryOptions & { searchText?: string }, // Enhanced options
  ): Promise<PaginatedQueryResult<CollectionQueryResultDTO>>;
}
```

**Changes Required**:
- Update `GetMyCollectionsQuery` interface
- Update `ICollectionQueryRepository.findByCreator()` method signature
- Update `DrizzleCollectionQueryRepository` implementation with text search logic
- Update API client types and methods
- Update HTTP controller to handle search parameter

### Option 2: Dedicated Search Use Case
**Pattern**: Create separate `SearchMyCollectionsUseCase`

**Pros**:
- Clear separation of concerns
- Optimized specifically for search scenarios
- Can implement different search algorithms/ranking
- Easier to add search-specific features (highlighting, relevance scoring)

**Implementation**:
```typescript
// New dedicated use case
export interface SearchMyCollectionsQuery {
  curatorId: string;
  searchText: string; // Required for search
  page?: number;
  limit?: number;
}

export interface SearchMyCollectionsResult {
  collections: CollectionSearchResultDTO[]; // Could include relevance scores
  pagination: PaginationInfo;
  searchMetadata: {
    query: string;
    totalMatches: number;
    searchTime?: number;
  };
}
```

**Changes Required**:
- Create new `SearchMyCollectionsUseCase`
- Create new repository method or separate search repository
- Create new HTTP controller and route
- Update API client with new search method
- Implement search-specific DTOs

### Option 3: Hybrid Approach
**Pattern**: Extend existing use case but add dedicated search endpoint

**Implementation**:
- Keep enhanced `GetMyCollectionsUseCase` for general listing with optional search
- Add dedicated `SearchMyCollectionsUseCase` for advanced search features
- Both share the same underlying repository search capability

## Recommended Approach: Option 1 (Extended Query)

### Rationale
1. **Consistency**: Aligns with existing patterns where query use cases handle filtering/searching
2. **Simplicity**: Single endpoint for both listing and searching collections
3. **Client Efficiency**: No need to switch between different API methods
4. **Future-Proof**: Easy to add more filter parameters later

### Implementation Plan

#### 1. Domain Layer Updates
```typescript
// Update ICollectionQueryRepository interface
export interface CollectionQueryOptions {
  page: number;
  limit: number;
  sortBy: CollectionSortField;
  sortOrder: SortOrder;
  searchText?: string; // NEW
}
```

#### 2. Application Layer Updates
```typescript
// Update GetMyCollectionsQuery
export interface GetMyCollectionsQuery {
  curatorId: string;
  page?: number;
  limit?: number;
  sortBy?: CollectionSortField;
  sortOrder?: SortOrder;
  searchText?: string; // NEW
}
```

#### 3. Infrastructure Layer Updates
- Update `DrizzleCollectionQueryRepository.findByCreator()` to handle text search
- Implement SQL text search (LIKE, full-text search, or similar)
- Update HTTP controller to accept search parameter
- Update route parameter handling

#### 4. API Client Updates
```typescript
// Update existing types
export interface GetMyCollectionsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchText?: string; // NEW
}

// No new methods needed - existing getMyCollections() handles search
```

### Search Implementation Details

#### Database Search Strategy
```sql
-- Example SQL for text search across name and description
SELECT * FROM collections 
WHERE curator_id = ? 
  AND (
    name ILIKE '%search_term%' 
    OR description ILIKE '%search_term%'
  )
ORDER BY name ASC
LIMIT ? OFFSET ?;
```

#### Search Behavior
- **Empty/null search**: Return all collections (existing behavior)
- **Search scope**: Collection name and description fields
- **Search type**: Case-insensitive partial matching (can be enhanced later)
- **Sorting**: Maintain existing sort options, could add relevance sorting later

### Migration Path
1. Update domain interfaces (backward compatible)
2. Update use case (backward compatible - search is optional)
3. Update repository implementation
4. Update HTTP layer
5. Update API client types
6. Update frontend components

This approach provides immediate value while maintaining architectural consistency and leaving room for future enhancements like advanced search features, search analytics, or dedicated search optimization.
