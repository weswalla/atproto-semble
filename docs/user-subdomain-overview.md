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
- **ISessionService**:
  - `createSession(did: string): Promise<string>`
  - `validateSession(sessionId: string): Promise<string | null>`
  - `destroySession(sessionId: string): Promise<void>`

## Infrastructure Layer

### Persistence
- **UserRepository**: Implements `IUserRepository` using database
- **SessionStore**: Implements session storage for OAuth client
- **StateStore**: Implements state parameter storage for OAuth flow

### Authentication
- **AtProtoOAuthProcessor**: Implements `IOAuthProcessor`
  - Wraps `NodeOAuthClient` from `@atproto/oauth-client-node`
  - Handles OAuth flow and token management
- **SessionService**: Implements `ISessionService`
  - Uses `iron-session` for secure cookie-based sessions
  - Manages session lifecycle

### API / Controllers
- **AuthController**:
  - `/login`: Initiates OAuth flow
  - `/oauth/callback`: Handles OAuth callback
  - `/logout`: Handles user logout
- **UserController**:
  - `/me`: Returns current user information
- **AuthMiddleware**:
  - `ensureAuthenticated`: Validates session and attaches user to request

## Implementation Details

### Authentication Flow
1. User initiates login via `/login` endpoint
2. System redirects to PDS for authentication
3. PDS redirects back to `/oauth/callback` with authorization code
4. System exchanges code for tokens via `NodeOAuthClient`
5. System creates/updates User entity and establishes session
6. User receives encrypted session cookie

### Session Management
- Server-side session state stored in database
- Client receives encrypted `HttpOnly` cookie
- Session contains minimal information (primarily user DID)
- Full ATProto session restored as needed using stored refresh tokens

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

### Auth Session Table
```sql
CREATE TABLE auth_session (
  key TEXT PRIMARY KEY,  -- DID
  session TEXT NOT NULL  -- JSON containing OAuth session data
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

This DDD approach to the User subdomain provides a clean separation of concerns while maintaining a minimal set of abstractions. The domain model focuses on the core concept of a User linked to an external ATProto identity, while the infrastructure layer handles the complexities of OAuth authentication and session management.
