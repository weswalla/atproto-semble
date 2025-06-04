# URL Metadata Strategy (DDD)

This document outlines the domain-driven approach for fetching, aggregating, and caching URL metadata from multiple external sources.

## Problem Statement

We need to:
1. Fetch metadata from multiple sources (Citoid, Iframely, etc.)
2. Cache results to avoid redundant API calls
3. Aggregate data from different sources intelligently
4. Maintain clean domain boundaries and testability

## Domain Model

### Value Objects

**UrlMetadata**
- Immutable value object containing all metadata fields
- Includes `source` field to track which service provided the data
- Includes `retrievedAt` timestamp for cache invalidation

**MetadataSource**
- Enumeration of available metadata sources (CITOID, IFRAMELY, etc.)

### Domain Services

**MetadataAggregationService**
- Coordinates fetching from multiple sources
- Implements intelligent merging strategies
- Handles fallback logic when sources fail

### Infrastructure Services

**IMetadataProvider** (Interface)
- Contract for individual metadata sources
- Implemented by CitoidMetadataService, IframelyMetadataService, etc.

**IMetadataRepository** (Interface)
- Stores and retrieves cached metadata by URL and source
- Enables querying for partial metadata to determine what's missing

## Architecture Pattern: Strategy + Repository + Aggregation

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  GetUrlMetadataUseCase                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Domain Layer                              │
│  MetadataAggregationService                                 │
│  ├── IMetadataRepository (cache check/store)                │
│  ├── IMetadataProvider[] (multiple sources)                 │
│  └── Aggregation Logic                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Infrastructure Layer                         │
│  ├── DrizzleMetadataRepository                              │
│  ├── CitoidMetadataService                                  │
│  ├── IframelyMetadataService                                │
│  └── OpenGraphMetadataService                               │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### 1. Provider Interface

```typescript
export interface IMetadataProvider {
  readonly source: MetadataSource;
  fetchMetadata(url: URL): Promise<Result<UrlMetadata>>;
  isAvailable(): Promise<boolean>;
}
```

### 2. Repository Interface

```typescript
export interface IMetadataRepository {
  findByUrl(url: URL): Promise<Result<UrlMetadata[]>>; // All cached metadata for URL
  findByUrlAndSource(url: URL, source: MetadataSource): Promise<Result<UrlMetadata | null>>;
  save(metadata: UrlMetadata): Promise<Result<void>>;
  isStale(metadata: UrlMetadata, maxAge: Duration): boolean;
}
```

### 3. Aggregation Service

```typescript
export class MetadataAggregationService {
  constructor(
    private readonly repository: IMetadataRepository,
    private readonly providers: IMetadataProvider[],
    private readonly maxCacheAge: Duration = Duration.days(7)
  ) {}

  async getMetadata(url: URL, sources?: MetadataSource[]): Promise<Result<UrlMetadata>> {
    // 1. Check cache for existing metadata
    const cached = await this.repository.findByUrl(url);
    
    // 2. Determine which sources need fresh data
    const sourcesToFetch = this.determineSourcesToFetch(cached, sources);
    
    // 3. Fetch from required sources in parallel
    const freshResults = await this.fetchFromSources(url, sourcesToFetch);
    
    // 4. Cache new results
    await this.cacheResults(freshResults);
    
    // 5. Aggregate all available metadata
    const allMetadata = [...(cached.isOk() ? cached.value : []), ...freshResults];
    return this.aggregateMetadata(allMetadata);
  }

  private aggregateMetadata(metadataList: UrlMetadata[]): Result<UrlMetadata> {
    // Intelligent merging logic:
    // - Prefer academic sources (Citoid) for scholarly content
    // - Prefer social media optimized sources (Iframely) for rich media
    // - Combine fields from multiple sources (e.g., best title, description, image)
  }
}
```

### 4. Use Case

```typescript
export class GetUrlMetadataUseCase {
  constructor(
    private readonly aggregationService: MetadataAggregationService
  ) {}

  async execute(url: string, preferredSources?: MetadataSource[]): Promise<Result<UrlMetadata>> {
    const urlResult = URL.create(url);
    if (urlResult.isErr()) {
      return err(urlResult.error);
    }

    return this.aggregationService.getMetadata(urlResult.value, preferredSources);
  }
}
```

## Caching Strategy

### Cache Key Structure
- Primary: `url_metadata:{url_hash}`
- Secondary: `url_metadata:{url_hash}:{source}`

### Cache Invalidation
- Time-based: 7 days default, configurable per source
- Manual: When user requests fresh metadata
- Source-specific: Different TTL for different providers

### Partial Cache Hits
- If we have Citoid data but need Iframely data, only fetch from Iframely
- Aggregate cached + fresh data intelligently

## Data Aggregation Rules

### Field Priority (Configurable)
1. **Title**: Citoid > Iframely > OpenGraph
2. **Description**: Iframely > Citoid > OpenGraph  
3. **Author**: Citoid > Iframely
4. **Image**: Iframely > OpenGraph > Citoid
5. **Published Date**: Citoid > Iframely

### Conflict Resolution
- Prefer more recent data when timestamps differ significantly
- Prefer more complete data (fewer null fields)
- Allow manual source preference overrides

## Benefits of This Approach

1. **Domain Purity**: Business logic stays in domain layer
2. **Testability**: Easy to mock providers and repository
3. **Flexibility**: Easy to add new metadata sources
4. **Performance**: Intelligent caching reduces API calls
5. **Reliability**: Fallback between sources when one fails
6. **Configurability**: Source preferences can be adjusted per use case

## Future Enhancements

1. **Source Health Monitoring**: Track success rates and response times
2. **Dynamic Source Selection**: Choose sources based on URL patterns
3. **Batch Processing**: Fetch metadata for multiple URLs efficiently
4. **User Preferences**: Allow users to prefer certain sources
5. **Metadata Enrichment**: Combine multiple sources for richer data

## Implementation Order

1. Define interfaces (`IMetadataProvider`, `IMetadataRepository`)
2. Implement repository with caching
3. Refactor existing `CitoidMetadataService` to implement `IMetadataProvider`
4. Implement `MetadataAggregationService`
5. Add additional providers (Iframely, OpenGraph)
6. Implement intelligent aggregation logic
7. Add monitoring and health checks
