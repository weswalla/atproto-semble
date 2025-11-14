# Firehose Event Handling - Layered Architecture Design

## Overview

This document outlines the layered architecture design for handling AT Protocol firehose events within our existing DDD structure. The system will process CREATE, UPDATE, and DELETE events for cards, collections, and collection links while implementing the duplicate detection strategy outlined in the previous document.

## Architecture Layers

### Domain Layer

#### New Domain Concepts

**AtUriResourceType Enum**
```typescript
export enum AtUriResourceType {
  CARD = 'card',
  COLLECTION = 'collection',
  COLLECTION_LINK = 'collection_link',
}
```

**Enhanced ATUri Domain Object**
```typescript
export class ATUri extends ValueObject<ATUriProps> {
  // ... existing methods ...
  
  public getEntityType(): AtUriResourceType {
    if (this.collection === 'network.cosmik.card') return AtUriResourceType.CARD;
    if (this.collection === 'network.cosmik.collection') return AtUriResourceType.COLLECTION;
    if (this.collection === 'network.cosmik.collection.link') return AtUriResourceType.COLLECTION_LINK;
    throw new Error(`Unknown collection type: ${this.collection}`);
  }
}
```

#### Enhanced Domain Services

**Expanded IAtUriResolutionService**
```typescript
export interface IAtUriResolutionService {
  resolveAtUri(atUri: string): Promise<Result<AtUriResolutionResult | null>>;
  resolveCardId(atUri: string): Promise<Result<CardId | null>>;
  resolveCollectionId(atUri: string): Promise<Result<CollectionId | null>>;
  resolveCollectionLinkId(atUri: string): Promise<Result<{collectionId: CollectionId, cardId: CardId} | null>>;
}
```

**New IFirehoseEventDuplicationService**
```typescript
export interface IFirehoseEventDuplicationService {
  hasEventBeenProcessed(
    atUri: string, 
    cid: string | null, 
    operation: FirehoseEventType
  ): Promise<Result<boolean>>;
  
  hasBeenDeleted(atUri: string): Promise<Result<boolean>>;
}
```

### Application Layer

#### New Domain Events

**FirehoseEventProcessed**
```typescript
export class FirehoseEventProcessed extends DomainEvent {
  constructor(
    public readonly atUri: string,
    public readonly cid: string | null,
    public readonly eventType: FirehoseEventType,
    public readonly entityType: AtUriResourceType,
    public readonly entityId?: string
  ) {
    super();
  }
}
```

#### New Use Cases

**ProcessFirehoseEventUseCase**
```typescript
export interface ProcessFirehoseEventDTO {
  atUri: string;
  cid: string | null;
  eventType: 'create' | 'update' | 'delete';
  record?: any; // The AT Protocol record data
}

export class ProcessFirehoseEventUseCase {
  constructor(
    private duplicationService: IFirehoseEventDuplicationService,
    private atUriResolutionService: IAtUriResolutionService,
    private cardRepository: ICardRepository,
    private collectionRepository: ICollectionRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(request: ProcessFirehoseEventDTO): Promise<Result<void>> {
    // 1. Check for duplicates
    // 2. Route to appropriate handler based on collection type
    // 3. Process the event
    // 4. Publish domain events
  }
}
```

**ProcessCardFirehoseEventUseCase**
```typescript
export class ProcessCardFirehoseEventUseCase {
  async execute(request: {
    atUri: string;
    cid: string | null;
    eventType: 'create' | 'update' | 'delete';
    record?: any;
  }): Promise<Result<void>> {
    // Handle card-specific firehose events
  }
}
```

**ProcessCollectionFirehoseEventUseCase**
```typescript
export class ProcessCollectionFirehoseEventUseCase {
  async execute(request: {
    atUri: string;
    cid: string | null;
    eventType: 'create' | 'update' | 'delete';
    record?: any;
  }): Promise<Result<void>> {
    // Handle collection-specific firehose events
  }
}
```

**ProcessCollectionLinkFirehoseEventUseCase**
```typescript
export class ProcessCollectionLinkFirehoseEventUseCase {
  async execute(request: {
    atUri: string;
    cid: string | null;
    eventType: 'create' | 'update' | 'delete';
    record?: any;
  }): Promise<Result<void>> {
    // Handle collection link-specific firehose events
  }
}
```

#### Event Handlers

**FirehoseEventHandler**
```typescript
export class FirehoseEventHandler {
  constructor(
    private processFirehoseEventUseCase: ProcessFirehoseEventUseCase
  ) {}

  async handle(event: AtProtoFirehoseEvent): Promise<Result<void>> {
    return this.processFirehoseEventUseCase.execute({
      atUri: event.uri,
      cid: event.cid,
      eventType: event.eventType,
      record: event.record
    });
  }
}
```

#### New Application Services

**IFirehoseService**
```typescript
export interface IFirehoseService {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}
```

### Infrastructure Layer

#### AT Protocol Firehose Integration

**AtProtoFirehoseService**
```typescript
export class AtProtoFirehoseService implements IFirehoseService {
  constructor(
    private firehoseEventHandler: FirehoseEventHandler,
    private configService: EnvironmentConfigService,
    private idResolver: IdResolver
  ) {}

  async start(): Promise<void> {
    const runner = new MemoryRunner({});
    
    this.firehose = new Firehose({
      service: 'wss://bsky.network',
      runner,
      idResolver: this.idResolver,
      filterCollections: this.getFilteredCollections(),
      handleEvent: this.handleFirehoseEvent.bind(this),
      onError: this.handleError.bind(this)
    });

    await this.firehose.start();
  }

  private async handleFirehoseEvent(evt: Event): Promise<void> {
    const result = await this.firehoseEventHandler.handle({
      uri: evt.uri,
      cid: evt.cid,
      eventType: evt.event as 'create' | 'update' | 'delete',
      record: evt.record,
      did: evt.did,
      collection: evt.collection
    });

    if (result.isErr()) {
      console.error('Failed to process firehose event:', result.error);
    }
  }

  private getFilteredCollections(): string[] {
    const collections = this.configService.getAtProtoCollections();
    return [
      collections.card,
      collections.collection,
      collections.collectionLink
    ];
  }
}
```

**DrizzleFirehoseEventDuplicationService**
```typescript
export class DrizzleFirehoseEventDuplicationService implements IFirehoseEventDuplicationService {
  constructor(private db: PostgresJsDatabase) {}

  async hasEventBeenProcessed(
    atUri: string, 
    cid: string | null, 
    operation: FirehoseEventType
  ): Promise<Result<boolean>> {
    try {
      // For CREATE/UPDATE: check if (uri, cid) exists
      if (operation === 'create' || operation === 'update') {
        if (!cid) return ok(false);
        
        const result = await this.db
          .select({ id: publishedRecords.id })
          .from(publishedRecords)
          .where(
            and(
              eq(publishedRecords.uri, atUri),
              eq(publishedRecords.cid, cid)
            )
          )
          .limit(1);
          
        return ok(result.length > 0);
      }
      
      // For DELETE: use more complex logic
      return this.hasBeenDeleted(atUri);
    } catch (error) {
      return err(error as Error);
    }
  }

  async hasBeenDeleted(atUri: string): Promise<Result<boolean>> {
    try {
      // 1. Find all publishedRecords with matching URI
      const records = await this.db
        .select()
        .from(publishedRecords)
        .where(eq(publishedRecords.uri, atUri));

      if (records.length === 0) {
        return ok(true); // No records = was deleted
      }

      // 2. Determine entity type from AT URI
      const atUriResult = ATUri.create(atUri);
      if (atUriResult.isErr()) {
        return err(atUriResult.error);
      }

      const entityType = atUriResult.value.getEntityType();

      // 3. Check if entity still exists
      switch (entityType) {
        case AtUriResourceType.COLLECTION:
          const collectionId = await this.atUriResolver.resolveCollectionId(atUri);
          return ok(collectionId === null);
        case AtUriResourceType.CARD:
          const cardId = await this.atUriResolver.resolveCardId(atUri);
          return ok(cardId === null);
        case AtUriResourceType.COLLECTION_LINK:
          const linkInfo = await this.atUriResolver.resolveCollectionLinkId(atUri);
          return ok(linkInfo === null);
        default:
          return err(new Error(`Unknown entity type: ${entityType}`));
      }
    } catch (error) {
      return err(error as Error);
    }
  }
}
```

**Enhanced DrizzleAtUriResolutionService**
```typescript
export class DrizzleAtUriResolutionService implements IAtUriResolutionService {
  // ... existing methods ...

  async resolveCardId(atUri: string): Promise<Result<CardId | null>> {
    try {
      const cardResult = await this.db
        .select({ id: cards.id })
        .from(cards)
        .innerJoin(publishedRecords, eq(cards.publishedRecordId, publishedRecords.id))
        .where(eq(publishedRecords.uri, atUri))
        .limit(1);

      if (cardResult.length === 0) {
        return ok(null);
      }

      const cardIdResult = CardId.createFromString(cardResult[0]!.id);
      if (cardIdResult.isErr()) {
        return err(cardIdResult.error);
      }

      return ok(cardIdResult.value);
    } catch (error) {
      return err(error as Error);
    }
  }

  async resolveCollectionLinkId(
    atUri: string
  ): Promise<Result<{collectionId: CollectionId, cardId: CardId} | null>> {
    try {
      const linkResult = await this.db
        .select({
          collectionId: collectionCards.collectionId,
          cardId: collectionCards.cardId
        })
        .from(collectionCards)
        .innerJoin(publishedRecords, eq(collectionCards.publishedRecordId, publishedRecords.id))
        .where(eq(publishedRecords.uri, atUri))
        .limit(1);

      if (linkResult.length === 0) {
        return ok(null);
      }

      const collectionIdResult = CollectionId.createFromString(linkResult[0]!.collectionId);
      const cardIdResult = CardId.createFromString(linkResult[0]!.cardId);

      if (collectionIdResult.isErr()) {
        return err(collectionIdResult.error);
      }
      if (cardIdResult.isErr()) {
        return err(cardIdResult.error);
      }

      return ok({
        collectionId: collectionIdResult.value,
        cardId: cardIdResult.value
      });
    } catch (error) {
      return err(error as Error);
    }
  }
}
```

#### Worker Process

**FirehoseWorkerProcess**
```typescript
export class FirehoseWorkerProcess extends BaseWorkerProcess {
  constructor(configService: EnvironmentConfigService) {
    super(configService, QueueNames.FIREHOSE);
  }

  protected createServices(repositories: Repositories): WorkerServices & {
    firehoseService: IFirehoseService;
  } {
    const baseServices = ServiceFactory.createForWorker(this.configService, repositories);
    
    // Create firehose-specific services
    const firehoseEventDuplicationService = new DrizzleFirehoseEventDuplicationService(
      repositories.database
    );
    
    const processFirehoseEventUseCase = new ProcessFirehoseEventUseCase(
      firehoseEventDuplicationService,
      repositories.atUriResolutionService,
      repositories.cardRepository,
      repositories.collectionRepository,
      baseServices.eventPublisher
    );
    
    const firehoseEventHandler = new FirehoseEventHandler(processFirehoseEventUseCase);
    
    const firehoseService = new AtProtoFirehoseService(
      firehoseEventHandler,
      this.configService,
      new IdResolver()
    );

    return {
      ...baseServices,
      firehoseService
    };
  }

  protected async validateDependencies(services: any): Promise<void> {
    // Validate firehose dependencies
  }

  protected async registerHandlers(
    subscriber: IEventSubscriber,
    services: any,
    repositories: Repositories,
  ): Promise<void> {
    // Start the firehose service instead of registering event handlers
    await services.firehoseService.start();
  }
}
```

## Event Flow

1. **AT Protocol Firehose** → Receives events from AT Protocol network
2. **AtProtoFirehoseService** → Filters and validates events
3. **FirehoseEventHandler** → Routes to appropriate use case
4. **ProcessFirehoseEventUseCase** → Checks duplicates and delegates
5. **Specific Event Use Cases** → Process card/collection/link events
6. **Domain Services** → Update entities and publish domain events
7. **Event Publishers** → Notify other parts of the system

## Configuration

**Environment Variables**
```bash
# Firehose configuration
ATPROTO_FIREHOSE_ENDPOINT=wss://bsky.network
FIREHOSE_RECONNECT_DELAY=3000
FIREHOSE_FILTER_COLLECTIONS=network.cosmik.card,network.cosmik.collection,network.cosmik.collection.link

# Enable/disable firehose processing
ENABLE_FIREHOSE_PROCESSING=true
```

## Error Handling

- **Network Errors**: Automatic reconnection with exponential backoff
- **Validation Errors**: Log and skip invalid records
- **Processing Errors**: Dead letter queue for failed events
- **Duplicate Detection**: Idempotent processing with CID-based deduplication

## Monitoring & Observability

- **Metrics**: Events processed, duplicates detected, processing latency
- **Logging**: Structured logs for all firehose events
- **Health Checks**: Firehose connection status, processing queue depth
- **Alerts**: Connection failures, high error rates, processing delays

## Testing Strategy

- **Unit Tests**: Individual use cases and services
- **Integration Tests**: End-to-end firehose event processing
- **Mock Firehose**: Test harness for simulating AT Protocol events
- **Load Tests**: High-volume event processing scenarios

## Deployment

- **Separate Worker**: Dedicated firehose worker process
- **Scaling**: Multiple worker instances with partitioned processing
- **Blue-Green**: Zero-downtime deployments with cursor management
- **Rollback**: Ability to replay events from specific cursor position

## Future Enhancements

1. **Server-side Filtering**: Reduce bandwidth with AT Protocol filters
2. **Event Sourcing**: Complete audit trail of all firehose events
3. **Real-time Sync**: WebSocket updates to web clients
4. **Cross-PDS Support**: Handle events from multiple AT Protocol servers
5. **Analytics**: Event processing metrics and insights
