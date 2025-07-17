# Authentication Middleware Approach

This document outlines the authentication middleware approach for securing API endpoints across different subdomains in our DDD architecture.

## Overview

The authentication middleware sits at the infrastructure layer and acts as a gatekeeper for protected routes. It validates JWT tokens, extracts user information, and makes this information available to controllers and use cases.

## Architecture

### Middleware Implementation

```typescript
// src/modules/user/infrastructure/middleware/AuthMiddleware.ts
export class AuthMiddleware {
  constructor(private tokenService: ITokenService) {}

  public ensureAuthenticated() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ message: 'No access token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Validate token
        const didResult = await this.tokenService.validateToken(token);

        if (didResult.isErr() || !didResult.value) {
          return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Attach user DID to request for use in controllers
        req.did = didResult.value;

        // Continue to the controller
        next();
      } catch (error) {
        return res.status(500).json({ message: 'Authentication error' });
      }
    };
  }
}
```

### Extended Request Interface

```typescript
// src/modules/user/infrastructure/http/types/AuthenticatedRequest.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  did: string; // The authenticated user's DID
}
```

## Usage in Routes

The middleware is applied to routes that require authentication:

```typescript
// src/modules/annotations/infrastructure/http/routes/annotationRoutes.ts
import { Router } from 'express';
import { AuthMiddleware } from '../../../../user/infrastructure/middleware/AuthMiddleware';
import { CreateAnnotationController } from '../controllers/CreateAnnotationController';

export const createAnnotationRoutes = (
  router: Router,
  authMiddleware: AuthMiddleware,
  createAnnotationController: CreateAnnotationController,
) => {
  router.post(
    '/annotations',
    authMiddleware.ensureAuthenticated(),
    (req, res) => createAnnotationController.execute(req, res),
  );

  // Other annotation routes...

  return router;
};
```

## Controller Implementation

Controllers can access the authenticated user's DID from the request:

```typescript
// src/modules/annotations/infrastructure/http/controllers/CreateAnnotationController.ts
import { Controller } from '../../../../../shared/infrastructure/http/Controller';
import { CreateAnnotationUseCase } from '../../../application/use-cases/CreateAnnotationUseCase';
import { AuthenticatedRequest } from '../../../../user/infrastructure/http/types/AuthenticatedRequest';
import { Response } from 'express';

export class CreateAnnotationController extends Controller {
  constructor(private createAnnotationUseCase: CreateAnnotationUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { url, fieldId, value } = req.body;

      // The DID is available from the request
      const { did } = req;

      const result = await this.createAnnotationUseCase.execute({
        curatorDid: did,
        url,
        fieldId,
        value,
      });

      if (result.isErr()) {
        const error = result.error;

        // Handle specific error types...

        return this.fail(res, error.message);
      }

      return this.ok(res, result.value);
    } catch (error) {
      return this.fail(res, error);
    }
  }
}
```

## Benefits

1. **Separation of Concerns**: Authentication logic is isolated in the middleware.
2. **Reusability**: The middleware can be applied to any route that requires authentication.
3. **Simplicity**: Controllers don't need to handle authentication logic.
4. **Consistency**: All authenticated routes follow the same pattern.
5. **Security**: Authentication happens before any business logic is executed.

## Integration with Dependency Injection

When using a dependency injection container:

```typescript
// src/modules/user/infrastructure/container.ts
container.register('authMiddleware', {
  useFactory: (tokenService) => new AuthMiddleware(tokenService),
  dependencies: ['tokenService'],
});

// src/modules/annotations/infrastructure/container.ts
container.register('annotationRouter', {
  useFactory: (authMiddleware, createAnnotationController) =>
    createAnnotationRoutes(
      Router(),
      authMiddleware,
      createAnnotationController,
    ),
  dependencies: ['authMiddleware', 'createAnnotationController'],
});
```

## Error Handling

The middleware handles common authentication errors:

- Missing token (401 Unauthorized)
- Invalid or expired token (403 Forbidden)
- Server errors during validation (500 Internal Server Error)

Custom error responses can be configured as needed.

## Conclusion

This middleware approach provides a clean, reusable way to handle authentication across different subdomains. It keeps the authentication logic at the infrastructure layer where it belongs, while making the authenticated user's identity available to controllers and use cases.
