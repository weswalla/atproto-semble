# Handling Unauthenticated and Authenticated Contexts in Use Cases

This document outlines our approach for designing use cases that support both authenticated and unauthenticated users within our DDD and layered architecture.

## Overview

Many business operations naturally support both authenticated and unauthenticated contexts. Rather than duplicating use cases, we pass caller context through the layers to enable different behavior based on authentication state.

## Why This Pattern Makes Sense

### Business Reality
- Many operations serve both user types (e.g., viewing public collections)
- Authenticated users often get enhanced functionality or additional data
- Same core business logic with context-dependent variations

### Architectural Benefits
- **Single Responsibility**: One use case per business operation
- **Explicit Dependencies**: Clear what context is needed
- **Clean Layer Separation**: Each layer handles its concerns appropriately
- **Avoids Duplication**: No need for separate authenticated/unauthenticated use cases

## Implementation Pattern

### Controller Layer
Extract authentication context from HTTP layer and pass it down:

```typescript
async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
  const result = await this.useCase.execute({
    // ... other params
    callerDid: req.did, // undefined if not authenticated
  });
}
```

### Use Case Layer
Accept optional caller context and pass it to domain services:

```typescript
export interface SomeQuery {
  targetId: string;
  callerDid?: string; // Optional - supports both auth states
  // ... other params
}

async execute(query: SomeQuery): Promise<Result<SomeResult>> {
  // Pass context to domain services that need it
  const result = await this.someService.doSomething(
    query.targetId,
    query.callerDid
  );
}
```

### Domain Service Layer
Make decisions based on caller identity:

```typescript
async doSomething(targetId: string, callerDid?: string): Promise<Result<Data>> {
  if (callerDid) {
    // Authenticated behavior - more data, different permissions
    return this.getEnhancedData(targetId, callerDid);
  } else {
    // Unauthenticated behavior - public data only
    return this.getPublicData(targetId);
  }
}
```

## Example: GetCollectionPageUseCase

```typescript
export class GetCollectionPageUseCase {
  async execute(query: GetCollectionPageQuery): Promise<Result<GetCollectionPageResult>> {
    // Core business logic remains the same
    const collection = await this.getCollection(query.collectionId);
    
    // Context affects behavior where needed
    const profile = await this.profileService.getProfile(
      collection.authorId.value,
      query.callerDid // undefined for unauth users
    );
    
    // Business rules can vary based on context
    if (this.isPrivateCollection(collection) && !this.canAccess(collection, query.callerDid)) {
      return err(new UnauthorizedError());
    }
    
    return ok(result);
  }
}
```

## Common Use Cases

This pattern works well for:
- **Profile viewing** (public vs private details)
- **Content feeds** (personalized vs generic)
- **Collection browsing** (access control based on caller)
- **Search results** (personalized ranking vs generic)

## When to Split Use Cases

Consider separate use cases when:
- **Fundamentally different operations**: `LoginUseCase` vs `GetPublicDataUseCase`
- **Complex branching**: If auth/unauth paths are completely different
- **Security isolation**: When you want to ensure certain code paths never run for unauthenticated users

## Best Practices

1. **Make context explicit** - Use `callerDid?: string` in query interfaces
2. **Fail gracefully** - Handle missing auth context appropriately
3. **Document behavior** - Be clear about what changes with authentication
4. **Validate early** - Check permissions at the start of the use case
5. **Optional middleware** - Consider `optionalAuthentication()` middleware for routes

## Alternative: Optional Authentication Middleware

For routes that support both contexts:

```typescript
// In routes
router.get('/:id', 
  authMiddleware.optionalAuthentication(), // Sets req.did if token present
  (req, res) => controller.execute(req, res)
);
```

This approach maintains clean separation of concerns while providing the flexibility needed for modern applications that serve both authenticated and anonymous users.
