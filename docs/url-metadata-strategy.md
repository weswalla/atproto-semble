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

- Immutable value object containing normalized metadata fields
- Derived from raw API responses through transformation
- Used by the domain layer for business logic

**RawMetadataResponse**

- Immutable value object containing the original API response
- Includes `source` field to track which service provided the data
- Includes `retrievedAt` timestamp for cache invalidation
- Preserves the exact JSON structure returned by each API

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
- Returns raw API responses wrapped in RawMetadataResponse
- Implemented by CitoidMetadataService, IframelyMetadataService, etc.

**IRawMetadataRepository** (Interface)

- Stores and retrieves raw API responses by URL and source
- Enables querying for existing raw data to determine what's missing
- Preserves original API response structure for future reprocessing

**IMetadataTransformer** (Interface)

- Transforms raw API responses into domain UrlMetadata objects
- Source-specific implementations handle different API response formats
- Enables reprocessing of stored raw data as domain models evolve

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
  fetchRawMetadata(url: URL): Promise<Result<RawMetadataResponse>>;
  isAvailable(): Promise<boolean>;
}
```

### 2. Repository Interface

```typescript
export interface IRawMetadataRepository {
  findByUrl(url: URL): Promise<Result<RawMetadataResponse[]>>; // All cached raw responses for URL
  findByUrlAndSource(
    url: URL,
    source: MetadataSource,
  ): Promise<Result<RawMetadataResponse | null>>;
  save(rawResponse: RawMetadataResponse): Promise<Result<void>>;
  isStale(rawResponse: RawMetadataResponse, maxAge: Duration): boolean;
}
```

### 3. Transformer Interface

```typescript
export interface IMetadataTransformer {
  readonly source: MetadataSource;
  transform(rawResponse: RawMetadataResponse): Result<UrlMetadata>;
}
```

### 4. Aggregation Service

```typescript
export class MetadataAggregationService {
  constructor(
    private readonly rawRepository: IRawMetadataRepository,
    private readonly providers: IMetadataProvider[],
    private readonly transformers: Map<MetadataSource, IMetadataTransformer>,
    private readonly maxCacheAge: Duration = Duration.days(7),
  ) {}

  async getMetadata(
    url: URL,
    sources?: MetadataSource[],
  ): Promise<Result<UrlMetadata>> {
    // 1. Check cache for existing raw responses
    const cachedRaw = await this.rawRepository.findByUrl(url);

    // 2. Determine which sources need fresh data
    const sourcesToFetch = this.determineSourcesToFetch(cachedRaw, sources);

    // 3. Fetch raw responses from required sources in parallel
    const freshRawResults = await this.fetchRawFromSources(url, sourcesToFetch);

    // 4. Cache new raw results
    await this.cacheRawResults(freshRawResults);

    // 5. Transform all available raw responses to domain objects
    const allRawResponses = [
      ...(cachedRaw.isOk() ? cachedRaw.value : []),
      ...freshRawResults,
    ];
    const transformedMetadata = this.transformRawResponses(allRawResponses);

    // 6. Aggregate transformed metadata
    return this.aggregateMetadata(transformedMetadata);
  }

  private transformRawResponses(
    rawResponses: RawMetadataResponse[],
  ): UrlMetadata[] {
    return rawResponses
      .map((raw) => {
        const transformer = this.transformers.get(raw.source);
        return transformer ? transformer.transform(raw) : null;
      })
      .filter((result) => result?.isOk())
      .map((result) => result!.value);
  }

  private aggregateMetadata(metadataList: UrlMetadata[]): Result<UrlMetadata> {
    // Intelligent merging logic:
    // - Prefer academic sources (Citoid) for scholarly content
    // - Prefer social media optimized sources (Iframely) for rich media
    // - Combine fields from multiple sources (e.g., best title, description, image)
  }
}
```

### 5. Use Case

```typescript
export class GetUrlMetadataUseCase {
  constructor(
    private readonly aggregationService: MetadataAggregationService,
  ) {}

  async execute(
    url: string,
    preferredSources?: MetadataSource[],
  ): Promise<Result<UrlMetadata>> {
    const urlResult = URL.create(url);
    if (urlResult.isErr()) {
      return err(urlResult.error);
    }

    return this.aggregationService.getMetadata(
      urlResult.value,
      preferredSources,
    );
  }
}
```

## Caching Strategy

### Cache Key Structure

- Raw responses: `raw_metadata:{url_hash}:{source}`
- Transformed metadata: `url_metadata:{url_hash}` (optional, for performance)

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

## Raw Data Storage Benefits

1. **Data Preservation**: Original API responses preserved exactly as returned
2. **Reprocessing Capability**: Can re-transform data as domain models evolve
3. **Debugging**: Easy to inspect what each API actually returned
4. **Audit Trail**: Complete history of API interactions
5. **Schema Evolution**: Domain objects can change without losing source data
6. **Multi-version Support**: Can support multiple versions of transformers

## Implementation Order

1. Define interfaces (`IMetadataProvider`, `IRawMetadataRepository`, `IMetadataTransformer`)
2. Implement raw metadata repository with caching
3. Create `RawMetadataResponse` value object
4. Refactor existing `CitoidMetadataService` to return raw responses
5. Implement `CitoidMetadataTransformer` to convert raw to domain objects
6. Implement `MetadataAggregationService`
7. Add additional providers and transformers (Iframely, OpenGraph)
8. Implement intelligent aggregation logic
9. Add monitoring and health checks
