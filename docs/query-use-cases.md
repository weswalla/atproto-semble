# Query Use Cases in DDD

This document outlines how to design and implement query use cases in our Domain-Driven Design (DDD) architecture, following CQRS (Command Query Responsibility Segregation) principles.

## Command vs Query Use Cases

### Command Use Cases (Write Side)
- **Purpose**: Modify state (create, update, delete)
- **Returns**: Minimal data (usually just IDs or success/failure)
- **Flow**: Go through domain entities and aggregates
- **Rules**: Enforce business rules and invariants
- **Examples**: `AddUrlToLibraryUseCase`, `CreateCollectionUseCase`, `UpdateNoteCardUseCase`

### Query Use Cases (Read Side)
- **Purpose**: Read data without modifying state
- **Returns**: Rich data optimized for display
- **Flow**: Can bypass domain entities for performance
- **Focus**: Data projection and formatting
- **Examples**: `GetMyCardsUseCase`, `GetCollectionDetailsUseCase`

## Query Use Case Patterns

### 1. Simple Query Through Repository
Use when you need basic data retrieval with minimal complexity.

```typescript
export class GetMyCardsUseCase {
  constructor(private cardRepository: ICardRepository) {}
  
  async execute(request: { curatorId: string }): Promise<Result<CardDTO[]>> {
    // Query through domain repository
    const cards = await this.cardRepository.findByCuratorId(curatorId);
    return ok(cards.map(card => this.toDTO(card)));
  }
}
```

### 2. Dedicated Query Repository (Recommended)
Use for most query scenarios where you need optimized read operations.

```typescript
export interface ICardQueryRepository {
  findCardsByLibraryMember(curatorId: string): Promise<CardListDTO[]>;
  findCardsInCollection(collectionId: string): Promise<CardListDTO[]>;
}

export class GetMyCardsUseCase {
  constructor(private cardQueryRepo: ICardQueryRepository) {}
  
  async execute(request: GetMyCardsQuery): Promise<Result<CardListDTO[]>> {
    // Optimized read-only queries
    const cards = await this.cardQueryRepo.findCardsByLibraryMember(request.curatorId);
    return ok(cards);
  }
}
```

### 3. Query Service with Projections
Use when you need to combine data from multiple sources or create complex projections.

```typescript
export class CardQueryService {
  constructor(
    private cardQueryRepo: ICardQueryRepository,
    private collectionQueryRepo: ICollectionQueryRepository
  ) {}
  
  async getMyCardsWithCollections(curatorId: string): Promise<EnrichedCardDTO[]> {
    // Join data from multiple sources
    const cards = await this.cardQueryRepo.findCardsByLibraryMember(curatorId);
    const collections = await this.collectionQueryRepo.findByCuratorId(curatorId);
    
    // Project into view model
    return this.enrichCardsWithCollections(cards, collections);
  }
}
```

## DTOs: Command vs Query

### Command DTOs (Minimal)
Focus on the data needed to perform the operation.

```typescript
export interface AddUrlToLibraryDTO {
  url: string;
  note?: string;
  curatorId: string;
}
```

### Query DTOs (Rich for Display)
Focus on data optimized for UI consumption.

```typescript
export interface CardListItemDTO {
  id: string;
  type: 'URL' | 'NOTE' | 'HIGHLIGHT';
  title: string;
  preview: string;
  createdAt: Date;
  collections: string[];
  isInLibrary: boolean;
  metadata?: {
    url?: string;
    author?: string;
    siteName?: string;
  };
}
```

## Composite Queries: Single vs Multiple Use Cases

When designing queries that need multiple pieces of related data (like a collection page that shows collection details + cards), you have two main options:

### Option 1: Single Composite Use Case (Recommended)

Use when:
- The data represents a **cohesive business concept** (e.g., "collection page view")
- The UI needs the data **atomically** (all or nothing)
- The data has **natural relationships** that are always needed together
- **Performance benefits** from single query with joins

```typescript
export interface GetCollectionPageQuery {
  collectionId: string;
  curatorId: string;
  // Card pagination
  cardPage?: number;
  cardLimit?: number;
  cardSearchTerm?: string;
}

export interface GetCollectionPageResult {
  collection: CollectionDetailsDTO;
  cards: {
    items: CardListItemDTO[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
  };
  userPermissions: {
    canEdit: boolean;
    canAddCards: boolean;
    canRemoveCards: boolean;
  };
}

export class GetCollectionPageUseCase {
  constructor(
    private collectionQueryRepo: ICollectionQueryRepository,
    private cardQueryRepo: ICardQueryRepository
  ) {}

  async execute(query: GetCollectionPageQuery): Promise<Result<GetCollectionPageResult>> {
    // Get collection details
    const collection = await this.collectionQueryRepo.findByIdWithPermissions(
      query.collectionId, 
      query.curatorId
    );
    
    // Get paginated cards in collection
    const cardsResult = await this.cardQueryRepo.findCardsInCollection(
      query.collectionId,
      {
        page: query.cardPage || 1,
        limit: query.cardLimit || 20,
        searchTerm: query.cardSearchTerm
      }
    );

    return ok({
      collection: collection.details,
      cards: cardsResult,
      userPermissions: collection.permissions
    });
  }
}
```

### Option 2: Separate Use Cases with Composition

Use when:
- Different **rates of change** (collection details change rarely, cards change often)
- Different **caching strategies** needed
- **Independent reusability** (cards list used elsewhere)
- Different **authorization rules** for each data type

```typescript
// Separate use cases
export class GetCollectionDetailsUseCase {
  async execute(query: { collectionId: string; curatorId: string }) {
    // Just collection details and permissions
  }
}

export class GetCollectionCardsUseCase {
  async execute(query: { collectionId: string; page: number; limit: number }) {
    // Just paginated cards
  }
}

// Composition at the application service level
export class CollectionPageService {
  constructor(
    private getCollectionDetails: GetCollectionDetailsUseCase,
    private getCollectionCards: GetCollectionCardsUseCase
  ) {}

  async getCollectionPage(query: GetCollectionPageQuery) {
    const [collection, cards] = await Promise.all([
      this.getCollectionDetails.execute({
        collectionId: query.collectionId,
        curatorId: query.curatorId
      }),
      this.getCollectionCards.execute({
        collectionId: query.collectionId,
        page: query.cardPage || 1,
        limit: query.cardLimit || 20
      })
    ]);

    return { collection: collection.value, cards: cards.value };
  }
}
```

## Query Repository Implementation

Query repositories can be optimized for read performance and bypass domain entities:

```typescript
export class SqlCardQueryRepository implements ICardQueryRepository {
  async findCardsByLibraryMember(curatorId: string): Promise<CardListDTO[]> {
    // Raw SQL for performance, bypassing domain entities
    return this.db.query(`
      SELECT c.id, c.type, c.title, c.created_at,
             array_agg(col.name) as collections
      FROM cards c
      JOIN library_memberships lm ON c.id = lm.card_id
      LEFT JOIN card_collection_links ccl ON c.id = ccl.card_id
      LEFT JOIN collections col ON ccl.collection_id = col.id
      WHERE lm.curator_id = $1
      GROUP BY c.id
    `, [curatorId]);
  }

  async findByIdWithCards(
    collectionId: string, 
    curatorId: string,
    cardPagination: PaginationOptions
  ): Promise<CollectionPageData> {
    // Single optimized query with joins
    const query = `
      SELECT 
        c.id, c.name, c.description, c.access_type,
        c.author_id, c.created_at,
        cards.id as card_id, cards.type, cards.title,
        COUNT(*) OVER() as total_cards
      FROM collections c
      LEFT JOIN card_collection_links ccl ON c.id = ccl.collection_id
      LEFT JOIN cards ON ccl.card_id = cards.id
      WHERE c.id = $1
      ORDER BY cards.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    // Transform to DTOs...
  }
}
```

## Best Practices

### 1. Design for the UI
- Structure query results to match what the UI actually needs
- Include computed fields and aggregations
- Consider pagination from the start

### 2. Optimize for Performance
- Use dedicated query repositories that can leverage database-specific optimizations
- Consider denormalized views for complex queries
- Use appropriate indexing strategies

### 3. Handle Pagination Consistently
```typescript
export interface PaginationOptions {
  page: number;
  limit: number;
  searchTerm?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}
```

### 4. Separate Query Models from Domain Models
- Query DTOs should be optimized for display, not domain logic
- Don't expose internal domain structure through query results
- Use mapping/projection layers

### 5. Consider Caching
- Query results are often good candidates for caching
- Design cache keys that can be invalidated when related commands execute
- Consider different cache strategies for different query types

## Example: Complete Query Use Case

```typescript
export interface GetMyCardsQuery {
  curatorId: string;
  page?: number;
  limit?: number;
  type?: CardTypeEnum;
  collectionId?: string;
  searchTerm?: string;
}

export interface GetMyCardsResult {
  cards: CardListItemDTO[];
  totalCount: number;
  hasMore: boolean;
  filters: {
    availableTypes: CardTypeEnum[];
    availableCollections: { id: string; name: string; }[];
  };
}

export class GetMyCardsUseCase {
  constructor(
    private cardQueryRepo: ICardQueryRepository,
    private collectionQueryRepo: ICollectionQueryRepository
  ) {}

  async execute(query: GetMyCardsQuery): Promise<Result<GetMyCardsResult>> {
    // Validate curator ID
    const curatorIdResult = CuratorId.create(query.curatorId);
    if (curatorIdResult.isErr()) {
      return err(new ValidationError("Invalid curator ID"));
    }

    // Get paginated cards
    const cardsResult = await this.cardQueryRepo.findCardsByLibraryMember(
      query.curatorId,
      {
        page: query.page || 1,
        limit: query.limit || 20,
        type: query.type,
        collectionId: query.collectionId,
        searchTerm: query.searchTerm
      }
    );

    // Get filter options
    const collections = await this.collectionQueryRepo.findByCuratorId(query.curatorId);

    return ok({
      cards: cardsResult.items,
      totalCount: cardsResult.totalCount,
      hasMore: cardsResult.hasMore,
      filters: {
        availableTypes: [CardTypeEnum.URL, CardTypeEnum.NOTE, CardTypeEnum.HIGHLIGHT],
        availableCollections: collections.map(c => ({ id: c.id, name: c.name }))
      }
    });
  }
}
```

This approach treats queries as first-class citizens in your domain, optimized for the specific needs of your application's read scenarios.
