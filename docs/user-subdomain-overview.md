# User Subdomain Overview (DDD Approach)

This document outlines the Domain-Driven Design (DDD) approach for the User subdomain, focusing on authentication via ATProto OAuth.

## Domain Layer

### Entities and Aggregates

#### User (Aggregate Root)

- **Properties**:
  - `id`: UniqueEntityID (based on the user's DID)
  - `did`: DID (Value Object)
  - `handle`: Handle (Value Object, optional)
  - `linkedAt`: Date (when the account was first linked)
  - `lastLoginAt`: Date (timestamp of last successful authentication)

#### Value Objects

- **DID**: Represents a validated `did:plc` string
  - Validates format
  - Provides methods for comparison and string representation
- **Handle**: Represents a validated Bluesky handle
  - Validates format
  - Provides methods for comparison and string representation

#### Domain Events

- **UserLinked**: Fired when a user completes OAuth flow for the first time
- **UserLoggedIn**: Fired on successful authentication

### Domain Services

- **UserAuthenticationService**: Core domain logic for user authentication
  - Validates authentication requests
  - Manages user session state

## Application Layer

### Use Cases / Application Services

#### InitiateOAuthSignInUseCase

- **Input**: Handle (optional)
- **Output**: Authorization URL
- **Behavior**: Prepares OAuth flow initiation

#### CompleteOAuthSignInUseCase

- **Input**: OAuth callback parameters (code, state)
- **Output**: User session information
- **Behavior**:
  - Processes OAuth callback
  - Creates or updates User entity
  - Dispatches domain events

#### GetCurrentUserUseCase

- **Input**: Session context
- **Output**: User information
- **Behavior**: Retrieves authenticated user information

### DTOs (Data Transfer Objects)

- **UserDTO**: Represents user data for external consumers
- **OAuthCallbackDTO**: Contains parameters from OAuth callback
- **SessionDTO**: Contains session information

### Repository Interfaces

- **IUserRepository**:
  - `findById(did: string): Promise<User | null>`
  - `save(user: User): Promise<void>`

### Service Interfaces

- **IOAuthProcessor**:
  - `processCallback(params: OAuthCallbackDTO): Promise<AuthResult>`
  - `generateAuthUrl(handle?: string): Promise<string>`
- **ITokenService**:
  - `generateToken(did: string): Promise<TokenPair>`
  - `validateToken(token: string): Promise<string | null>` // Returns DID if valid
  - `refreshToken(refreshToken: string): Promise<TokenPair | null>`
  - `revokeToken(refreshToken: string): Promise<void>`

## Infrastructure Layer

### Persistence

- **UserRepository**: Implements `IUserRepository` using database
- **SessionStore**: Implements session storage for OAuth client
- **StateStore**: Implements state parameter storage for OAuth flow

### Authentication

- **AtProtoOAuthProcessor**: Implements `IOAuthProcessor`
  - Wraps `NodeOAuthClient` from `@atproto/oauth-client-node`
  - Handles OAuth flow and token management
- **TokenService**: Implements `ITokenService`
  - Generates and validates JWT tokens for API authentication
  - Manages token lifecycle and refresh

### API / Controllers

- **AuthController**:
  - `/login`: Initiates OAuth flow
  - `/oauth/callback`: Handles OAuth callback
  - `/oauth/token`: Issues JWT tokens after successful OAuth
  - `/oauth/refresh`: Refreshes access token using refresh token
  - `/oauth/revoke`: Revokes refresh token
- **UserController**:
  - `/me`: Returns current user information
- **AuthMiddleware**:
  - `ensureAuthenticated`: Validates JWT token and attaches user to request
  - Used across all protected routes in different subdomains
  - Acts as a gatekeeper at the infrastructure layer

## Implementation Details

### Authentication Flow

1. User initiates login via `/login` endpoint
2. System redirects to PDS for authentication
3. PDS redirects back to `/oauth/callback` with authorization code
4. System exchanges code for PDS tokens via `NodeOAuthClient`
5. System creates/updates User entity and generates JWT tokens
6. Client receives access and refresh tokens in response
7. Client includes access token in subsequent API requests
8. AuthMiddleware validates tokens for protected routes

### Token Management

- JWT-based authentication with access and refresh tokens
- Access tokens are short-lived (e.g., 1 hour)
- Refresh tokens are longer-lived (e.g., 30 days)
- Tokens contain minimal claims (primarily user DID)
- Full ATProto session restored as needed using stored PDS refresh tokens

### Token Refresh

- Access tokens automatically refreshed via `NodeOAuthClient`
- Refresh tokens securely stored in `SessionStore`
- Token refresh transparent to application code

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- DID
  handle TEXT,
  linked_at TIMESTAMP NOT NULL,
  last_login_at TIMESTAMP NOT NULL
);
```

### Auth Tokens Table

```sql
CREATE TABLE auth_refresh_tokens (
  token_id TEXT PRIMARY KEY,
  user_did TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_did) REFERENCES users(id)
);
```

### Auth State Table

```sql
CREATE TABLE auth_state (
  key TEXT PRIMARY KEY,  -- State parameter
  state TEXT NOT NULL,   -- JSON containing state data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Conclusion

This DDD approach to the User subdomain provides a clean separation of concerns while maintaining a minimal set of abstractions. The domain model focuses on the core concept of a User linked to an external ATProto identity, while the infrastructure layer handles the complexities of OAuth authentication and token management.

The AuthMiddleware component serves as a critical cross-cutting concern that enforces authentication across all protected routes in the application. By implementing this middleware at the infrastructure layer, we maintain a clean separation between authentication logic and business logic, allowing other subdomains to focus on their core responsibilities while still benefiting from a consistent authentication mechanism.

For more details on the authentication middleware implementation, see [auth-middleware.md](./auth-middleware.md).
