# Use Case Implementation Patterns

This guide documents the patterns and best practices for implementing use cases in the Semble application, with full vertical stack integration.

## Table of Contents

1. [Use Case Structure](#use-case-structure)
2. [Repository Patterns](#repository-patterns)
3. [Upsert Behavior Pattern](#upsert-behavior-pattern)
4. [Explicit Control Pattern](#explicit-control-pattern)
5. [Testing Patterns](#testing-patterns)
6. [Full Stack Integration](#full-stack-integration)

## Use Case Structure

### Base Template

```typescript
import { Result, ok, err } from '../../../../../shared/core/Result';
import { BaseUseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IEventPublisher } from '../../../../../shared/application/events/IEventPublisher';

export interface YourUseCaseDTO {
  // Input parameters
  field: string;
  curatorId: string;
}

export interface YourUseCaseResponseDTO {
  // Response fields
  id: string;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class YourUseCase extends BaseUseCase<
  YourUseCaseDTO,
  Result<YourUseCaseResponseDTO, ValidationError | AppError.UnexpectedError>
> {
  constructor(
    private repository: IRepository,
    private domainService: DomainService,
    eventPublisher: IEventPublisher,
  ) {
    super(eventPublisher);
  }

  async execute(
    request: YourUseCaseDTO,
  ): Promise<
    Result<YourUseCaseResponseDTO, ValidationError | AppError.UnexpectedError>
  > {
    try {
      // 1. Validate input and create value objects
      const valueObjectResult = ValueObject.create(request.field);
      if (valueObjectResult.isErr()) {
        return err(new ValidationError(valueObjectResult.error.message));
      }

      // 2. Check existence/preconditions
      const existingEntity = await this.repository.findByX(...);
      if (existingEntity.isErr()) {
        return err(AppError.UnexpectedError.create(existingEntity.error));
      }

      // 3. Execute business logic
      // ...

      // 4. Persist changes
      const saveResult = await this.repository.save(entity);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      // 5. Publish events
      const publishResult = await this.publishEventsForAggregate(entity);
      if (publishResult.isErr()) {
        console.error('Failed to publish events:', publishResult.error);
        // Don't fail the operation if event publishing fails
      }

      // 6. Return success
      return ok({ id: entity.id.getStringValue() });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
```

## Repository Patterns

### Finding Related Entities

When you need to find related entities (e.g., note cards for a URL card), add specific repository methods:

#### Interface Definition

```typescript
// src/modules/cards/domain/ICardRepository.ts
export interface ICardRepository {
  findById(id: CardId): Promise<Result<Card | null>>;
  findUsersUrlCardByUrl(
    url: URL,
    curatorId: CuratorId,
  ): Promise<Result<Card | null>>;
  findUsersNoteCardByUrl(
    url: URL,
    curatorId: CuratorId,
  ): Promise<Result<Card | null>>;
  save(card: Card): Promise<Result<void>>;
  delete(cardId: CardId): Promise<Result<void>>;
}
```

#### In-Memory Implementation (for tests)

```typescript
async findUsersNoteCardByUrl(
  url: URL,
  curatorId: CuratorId,
): Promise<Result<Card | null>> {
  try {
    const card = Array.from(this.cards.values()).find(
      (card) =>
        card.type.value === 'NOTE' &&
        card.url?.value === url.value &&
        card.props.curatorId.equals(curatorId),
    );
    return ok(card ? this.clone(card) : null);
  } catch (error) {
    return err(error as Error);
  }
}
```

#### Drizzle Implementation

```typescript
async findUsersNoteCardByUrl(
  url: URL,
  curatorId: CuratorId,
): Promise<Result<Card | null>> {
  try {
    const urlValue = url.value;

    const cardResult = await this.db
      .select()
      .from(cards)
      .where(
        and(
          eq(cards.url, urlValue),
          eq(cards.type, 'NOTE'),
          eq(cards.authorId, curatorId.value),
        ),
      )
      .limit(1);

    if (cardResult.length === 0) {
      return ok(null);
    }

    // ... map to domain entity
  } catch (error) {
    return err(error as Error);
  }
}
```

## Upsert Behavior Pattern

Use this pattern when you want **additive** behavior - only add, never remove.

### Example: AddUrlToLibraryUseCase

This use case demonstrates modified upsert behavior:

- If URL card doesn't exist: Create it
- If URL card exists: Reuse it
- If note is provided and note card exists: **Update** the note
- If note is provided and note card doesn't exist: **Create** the note
- If collections are provided: **Only add** to collections (never remove)

```typescript
// Check if note card already exists
const existingNoteCardResult = await this.cardRepository.findUsersNoteCardByUrl(
  url,
  curatorId,
);
if (existingNoteCardResult.isErr()) {
  return err(AppError.UnexpectedError.create(existingNoteCardResult.error));
}

noteCard = existingNoteCardResult.value;

if (noteCard) {
  // Update existing note card
  const newContentResult = CardContent.createNoteContent(request.note);
  if (newContentResult.isErr()) {
    return err(new ValidationError(newContentResult.error.message));
  }

  const updateContentResult = noteCard.updateContent(newContentResult.value);
  if (updateContentResult.isErr()) {
    return err(new ValidationError(updateContentResult.error.message));
  }

  const saveNoteCardResult = await this.cardRepository.save(noteCard);
  if (saveNoteCardResult.isErr()) {
    return err(AppError.UnexpectedError.create(saveNoteCardResult.error));
  }
} else {
  // Create new note card
  // ...
}

// Collections are ONLY added (via addCardToCollections service)
// This service adds to collections but doesn't remove from existing ones
if (request.collectionIds && request.collectionIds.length > 0) {
  const addToCollectionsResult =
    await this.cardCollectionService.addCardToCollections(
      urlCard,
      collectionIds,
      curatorId,
    );
  // ...
}
```

### Testing Upsert Behavior

```typescript
it('should update existing note card when URL already exists with a note', async () => {
  const url = 'https://example.com/existing';

  // First request creates URL card with note
  const firstRequest = {
    url,
    note: 'Original note',
    curatorId: curatorId.value,
  };
  const firstResult = await useCase.execute(firstRequest);
  expect(firstResult.isOk()).toBe(true);
  const firstResponse = firstResult.unwrap();

  // Second request updates the note
  const secondRequest = {
    url,
    note: 'Updated note',
    curatorId: curatorId.value,
  };
  const secondResult = await useCase.execute(secondRequest);
  expect(secondResult.isOk()).toBe(true);
  const secondResponse = secondResult.unwrap();

  // Should have same note card ID
  expect(secondResponse.noteCardId).toBe(firstResponse.noteCardId);

  // Verify note was updated
  const savedCards = cardRepository.getAllCards();
  const updatedNoteCard = savedCards.find(
    (card) => card.content.type === CardTypeEnum.NOTE,
  );
  expect(updatedNoteCard?.content.noteContent?.text).toBe('Updated note');
});
```

## Explicit Control Pattern

Use this pattern when you need **precise control** over what gets added and removed.

### Example: UpdateUrlCardAssociationsUseCase

This use case demonstrates explicit control:

- Requires URL card to already exist
- Provides separate controls for adding vs removing collections
- Can create or update notes
- Returns detailed information about what changed

```typescript
export interface UpdateUrlCardAssociationsDTO {
  url: string;
  curatorId: string;
  note?: string;
  addToCollections?: string[]; // Explicit add
  removeFromCollections?: string[]; // Explicit remove
}

export interface UpdateUrlCardAssociationsResponseDTO {
  urlCardId: string;
  noteCardId?: string;
  addedToCollections: string[]; // What was actually added
  removedFromCollections: string[]; // What was actually removed
}

// In execute():
// 1. Require URL card to exist
const urlCard = existingUrlCardResult.value;
if (!urlCard) {
  return err(
    new ValidationError(
      'URL card not found. Please add the URL to your library first.',
    ),
  );
}

// 2. Handle adding to collections
if (request.addToCollections && request.addToCollections.length > 0) {
  const addToCollectionsResult =
    await this.cardCollectionService.addCardToCollections(
      urlCard,
      collectionIds,
      curatorId,
    );
  // Track what was added
  for (const collection of addToCollectionsResult.value) {
    addedToCollections.push(collection.collectionId.getStringValue());
  }
}

// 3. Handle removing from collections
if (request.removeFromCollections && request.removeFromCollections.length > 0) {
  const removeFromCollectionsResult =
    await this.cardCollectionService.removeCardFromCollections(
      urlCard,
      collectionIds,
      curatorId,
    );
  // Track what was removed
  for (const collection of removeFromCollectionsResult.value) {
    removedFromCollections.push(collection.collectionId.getStringValue());
  }
}

return ok({
  urlCardId: urlCard.cardId.getStringValue(),
  noteCardId: noteCard?.cardId.getStringValue(),
  addedToCollections,
  removedFromCollections,
});
```

### Testing Explicit Control

```typescript
it('should add and remove from different collections in same request', async () => {
  // Setup: URL in collection1
  await addUrlToLibraryUseCase.execute({
    url,
    collectionIds: [collection1.collectionId.getStringValue()],
    curatorId: curatorId.value,
  });

  // Execute: Add to collection2 and collection3, remove from collection1
  const result = await useCase.execute({
    url,
    curatorId: curatorId.value,
    addToCollections: [
      collection2.collectionId.getStringValue(),
      collection3.collectionId.getStringValue(),
    ],
    removeFromCollections: [collection1.collectionId.getStringValue()],
  });

  // Verify
  expect(result.isOk()).toBe(true);
  const response = result.unwrap();
  expect(response.addedToCollections).toHaveLength(2);
  expect(response.removedFromCollections).toHaveLength(1);
  expect(response.addedToCollections).toContain(
    collection2.collectionId.getStringValue(),
  );
  expect(response.removedFromCollections).toContain(
    collection1.collectionId.getStringValue(),
  );
});
```

## Testing Patterns

### Test File Structure

```typescript
describe('YourUseCase', () => {
  let useCase: YourUseCase;
  let repository: InMemoryRepository;
  let domainService: DomainService;
  let eventPublisher: FakeEventPublisher;

  beforeEach(() => {
    repository = new InMemoryRepository();
    eventPublisher = new FakeEventPublisher();
    domainService = new DomainService(repository, eventPublisher);

    useCase = new YourUseCase(repository, domainService, eventPublisher);
  });

  afterEach(() => {
    repository.clear();
    eventPublisher.clear();
  });

  describe('Feature group 1', () => {
    it('should do X when Y', async () => {
      // Arrange
      const request = {
        /* ... */
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.isOk()).toBe(true);
      // ... more assertions
    });
  });

  describe('Validation', () => {
    it('should fail with invalid input', async () => {
      const result = await useCase.execute({
        /* invalid */
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('expected error');
      }
    });
  });
});
```

### Test Coverage Checklist

For each use case, ensure tests cover:

- ✅ Happy path (basic functionality)
- ✅ Update existing entities
- ✅ Create new entities
- ✅ Edge cases (empty inputs, null values)
- ✅ Validation errors (invalid IDs, invalid URLs, etc.)
- ✅ Not found scenarios
- ✅ Permission/authorization scenarios
- ✅ Multiple operations in single request
- ✅ Event publishing verification

## Full Stack Integration

### 1. Use Case Factory

Add to `src/shared/infrastructure/http/factories/UseCaseFactory.ts`:

```typescript
// 1. Import
import { YourUseCase } from '../../../../modules/cards/application/useCases/commands/YourUseCase';

// 2. Add to interface
export interface UseCases {
  // ...
  yourUseCase: YourUseCase;
}

// 3. Instantiate in createForWebApp
return {
  // ...
  yourUseCase: new YourUseCase(
    repositories.cardRepository,
    services.domainService,
    services.eventPublisher,
  ),
};
```

### 2. Controller

Create `src/modules/cards/infrastructure/http/controllers/YourController.ts`:

```typescript
import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { Response } from 'express';
import { YourUseCase } from '../../../application/useCases/commands/YourUseCase';
import { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middleware/AuthMiddleware';

export class YourController extends Controller {
  constructor(private yourUseCase: YourUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { field1, field2 } = req.body;
      const curatorId = req.did;

      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!field1) {
        return this.badRequest(res, 'Field1 is required');
      }

      const result = await this.yourUseCase.execute({
        field1,
        field2,
        curatorId,
      });

      if (result.isErr()) {
        return this.fail(res, result.error);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
```

### 3. Controller Factory

Add to `src/shared/infrastructure/http/factories/ControllerFactory.ts`:

```typescript
// 1. Import
import { YourController } from '../../../../modules/cards/infrastructure/http/controllers/YourController';

// 2. Add to interface
export interface Controllers {
  // ...
  yourController: YourController;
}

// 3. Instantiate
return {
  // ...
  yourController: new YourController(useCases.yourUseCase),
};
```

### 4. Routes

Add to `src/modules/cards/infrastructure/http/routes/cardRoutes.ts`:

```typescript
// 1. Import controller type
import { YourController } from '../controllers/YourController';

// 2. Add parameter to createCardRoutes
export function createCardRoutes(
  authMiddleware: AuthMiddleware,
  // ...
  yourController: YourController,
): Router {
  // ...

  // 3. Add route
  router.put(
    '/your-endpoint',
    authMiddleware.ensureAuthenticated(),
    (req, res) => yourController.execute(req, res),
  );

  return router;
}
```

### 5. Wire through module routes

Update `src/modules/cards/infrastructure/http/routes/index.ts`:

```typescript
// 1. Import
import { YourController } from '../controllers/YourController';

// 2. Add parameter
export function createCardsModuleRoutes(
  authMiddleware: AuthMiddleware,
  // ...
  yourController: YourController,
): Router {
  // ...

  // 3. Pass to createCardRoutes
  router.use(
    '/cards',
    createCardRoutes(
      authMiddleware,
      // ...
      yourController,
    ),
  );

  return router;
}
```

### 6. Wire through app

Update `src/shared/infrastructure/http/app.ts`:

```typescript
const cardsRouter = createCardsModuleRoutes(
  services.authMiddleware,
  // ...
  controllers.yourController,
);
```

## Best Practices

### 1. Value Object Validation

Always validate and create value objects early in the use case:

```typescript
const curatorIdResult = CuratorId.create(request.curatorId);
if (curatorIdResult.isErr()) {
  return err(
    new ValidationError(`Invalid curator ID: ${curatorIdResult.error.message}`),
  );
}
const curatorId = curatorIdResult.value;
```

### 2. Error Handling

- Use `ValidationError` for business rule violations
- Use `AppError.UnexpectedError` for infrastructure errors
- Don't fail operations if event publishing fails (log instead)

```typescript
const publishResult = await this.publishEventsForAggregate(entity);
if (publishResult.isErr()) {
  console.error('Failed to publish events:', publishResult.error);
  // Don't fail the operation
}
```

### 3. Domain Services

Use domain services for cross-aggregate operations:

```typescript
// ✅ Good - uses domain service
await this.cardCollectionService.addCardToCollections(
  card,
  collectionIds,
  curatorId,
);

// ❌ Bad - directly manipulating aggregates
collection.addCard(card.cardId, curatorId);
await this.collectionRepository.save(collection);
```

### 4. Response DTOs

Return detailed information about what changed:

```typescript
return ok({
  id: entity.id.getStringValue(),
  created: !existingEntity,
  updated: !!existingEntity,
  affectedCollections: updatedCollections.map((c) => c.id.getStringValue()),
});
```

### 5. Idempotency

Design use cases to be idempotent when possible:

- Check existence before creating
- Only update if values actually changed
- Handle "already exists" gracefully

## Common Patterns Summary

| Pattern              | When to Use                             | Key Characteristics                                                                        |
| -------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Upsert**           | When user intent is "ensure this state" | - Create if not exists<br/>- Update if exists<br/>- Only add, never remove                 |
| **Explicit Control** | When user needs precise control         | - Separate add/remove operations<br/>- Returns what changed<br/>- Requires entity to exist |
| **Create Only**      | When creating new entities              | - Fails if already exists<br/>- Simple validation                                          |
| **Update Only**      | When modifying existing entities        | - Requires entity to exist<br/>- Validates ownership/permissions                           |

## References

### Example Implementations

- **Upsert**: `src/modules/cards/application/useCases/commands/AddUrlToLibraryUseCase.ts:147-234`
- **Explicit Control**: `src/modules/cards/application/useCases/commands/UpdateUrlCardAssociationsUseCase.ts`
- **Repository Methods**: `src/modules/cards/domain/ICardRepository.ts:15-18`

### Related Guides

- Domain-Driven Design patterns
- Repository pattern
- Event publishing
- Integration testing
