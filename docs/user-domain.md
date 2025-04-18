# User Domain Model (DDD)

This document outlines the domain model for user management within this application, specifically focusing on linking existing Bluesky accounts via the ATProto OAuth flow.

## Bounded Contexts

We introduce a new **User Management Context**, distinct from the Annotations context.

1.  **User Management Context:** Responsible for representing users within this application, linking them to their external Bluesky identity via OAuth, and managing their session state.
2.  **Annotations Context:** (Existing) Manages annotations, fields, and templates. Users from the User Management context will be the actors performing actions within the Annotations context.
3.  **ATProto Context:** (Existing) Provides low-level ATProto types (`StrongRef`, `TID`) and potentially infrastructure adapters for interacting with the AT Protocol (including OAuth).

## Layered Architecture (User Management Context)

### 1. Domain Layer

Contains the core representation of a user within this application.

*   **Aggregates & Entities:**
    *   `User` (Aggregate Root):
        *   Represents a user account *within this application*.
        *   `id`: `string` (The user's Bluesky DID - `did:plc:...`). This acts as the unique identifier linking to the external identity and the primary key within this context.
        *   `handle`: `string` (The user's Bluesky handle at the time of linking or last refresh). Optional or fetched on demand.
        *   `linkedAt`: `Date` (Timestamp when the account was first linked via OAuth).
        *   `lastLoginAt`: `Date` (Timestamp of the last successful OAuth authentication/refresh).
        *   *(Potentially other application-specific user profile data)*
        *   *Note:* This aggregate does *not* directly store OAuth tokens (access/refresh). Token management is handled separately as part of the authentication session state, likely managed by the infrastructure layer based on the OAuth client library's needs.

*   **Value Objects:**
    *   `DID`: Represents a validated `did:plc` string.
    *   `Handle`: Represents a validated Bluesky handle string.

*   **Domain Events:**
    *   `UserAccountLinked` (`userId`: DID, `handle`: Handle, `linkedAt`: Date) - Dispatched when a user successfully completes the OAuth flow for the first time.
    *   `UserLoggedIn` (`userId`: DID, `loginAt`: Date) - Dispatched on successful authentication/callback completion.

### 2. Application Layer

Orchestrates the process of linking accounts and managing user data.

*   **Use Cases / Application Services:**
    *   `InitiateOAuthSignInUseCase`: (May not be needed if the OAuth client library handles redirect generation directly in the Presentation layer). Takes a handle (optional) and returns the authorization URL to redirect the user to.
    *   `CompleteOAuthSignInUseCase`: Handles the logic after the user returns from the OAuth provider's callback URL.
        *   Takes the callback parameters (code, state) as input.
        *   Uses an `IOAuthProcessor` (infra interface) to validate the callback and obtain the authenticated user's session data (including DID and tokens).
        *   Uses the `IUserRepository` to find or create a `User` aggregate based on the returned DID.
        *   Updates user details (e.g., `lastLoginAt`, potentially fetches/updates `handle`).
        *   Saves the `User` aggregate via `IUserRepository`.
        *   Dispatches `UserAccountLinked` or `UserLoggedIn` events.
        *   Returns a `UserOutputDTO` or session identifier for the presentation layer.
    *   `GetUserUseCase`: Retrieves a `User` by their DID.
    *   `GetCurrentUserUseCase`: Retrieves the `User` associated with the current valid session. (Requires session context).

*   **Data Transfer Objects (DTOs):**
    *   `UserOutputDTO`: Represents the `User` aggregate data for external callers (`id`, `handle`, `linkedAt`, `lastLoginAt`).
    *   `OAuthCallbackInputDTO`: Contains parameters from the OAuth callback URL (`code`, `state`).
    *   `CompleteOAuthSignInOutputDTO`: Contains `UserOutputDTO` and potentially status/session info.

*   **Repository Interfaces:**
    *   `IUserRepository`: Interface for persisting and retrieving `User` aggregates (`findById(did)`, `save(user)`).

*   **Infrastructure Service Interfaces:** (Interfaces defined here, implemented in Infrastructure)
    *   `IOAuthProcessor`: An abstraction over the `@atproto/oauth-client-node` library's core callback processing and session management logic. Methods like `processCallback(params)` returning authenticated user DID and potentially session handle. This interface allows decoupling the use case from the specific library implementation.
    *   `IOAuthSessionStore`: Interface matching the `sessionStore` required by `@atproto/oauth-client-node`. Defines `get(sub)`, `set(sub, session)`, `del(sub)`.
    *   `IOAuthStateStore`: Interface matching the `stateStore` required by `@atproto/oauth-client-node`. Defines `get(key)`, `set(key, state)`, `del(key)`.

### 3. Infrastructure Layer

Contains implementation details for persistence, OAuth handling, and external communication.

*   **Persistence:**
    *   `UserRepository`: Implements `IUserRepository` using Drizzle/SQL, mapping the `User` aggregate to a `users` table.
    *   `DrizzleOAuthSessionStore`: Implements `IOAuthSessionStore` using Drizzle/SQL (or Redis, etc.) to store the `Session` data required by the OAuth client library, keyed by user DID (`sub`).
    *   `DrizzleOAuthStateStore`: Implements `IOAuthStateStore` using Drizzle/SQL (or Redis with TTL) to store temporary OAuth state data, keyed by the state parameter.
*   **OAuth Handling:**
    *   Configuration and instantiation of `NodeOAuthClient` from `@atproto/oauth-client-node`.
    *   Provides the concrete implementations of `IOAuthSessionStore` and `IOAuthStateStore` to the `NodeOAuthClient`.
    *   `AtProtoOAuthProcessor`: Implements `IOAuthProcessor`. This class wraps the configured `NodeOAuthClient` instance. Its `processCallback` method would call the underlying `client.callback(params)` method and handle mapping the result/errors.
*   **API / Presentation (e.g., Express.js):**
    *   `/login` endpoint: Uses the configured `NodeOAuthClient` (or a thin wrapper) to generate the authorization URL (`client.authorize(...)`) and redirects the user.
    *   `/atproto-oauth-callback` endpoint:
        1.  Receives the callback request from the browser.
        2.  Extracts parameters (`code`, `state`) from the URL.
        3.  Calls the `CompleteOAuthSignInUseCase` with the parameters.
        4.  The Use Case uses the `IOAuthProcessor` (which uses `client.callback`) to handle the OAuth exchange. The `client.callback` internally uses the `IOAuthSessionStore` and `IOAuthStateStore` implementations.
        5.  The Use Case proceeds to find/create the `User` via `IUserRepository`.
        6.  The endpoint handles the response from the Use Case (e.g., sets an application session cookie, redirects the user to their dashboard).

## Interaction Flow (OAuth Callback Example)

1.  **User Redirected:** User is redirected from Bluesky back to `/atproto-oauth-callback?code=...&state=...`.
2.  **Controller:** The Express route handler for `/atproto-oauth-callback` receives the request.
3.  **Controller -> Use Case:** The handler extracts `code` and `state` and calls `CompleteOAuthSignInUseCase.execute({ code, state })`.
4.  **Use Case -> OAuth Processor:** The use case calls `IOAuthProcessor.processCallback({ code, state })`.
5.  **OAuth Processor -> OAuth Client Lib:** The `AtProtoOAuthProcessor` implementation calls `nodeOAuthClient.callback(params)`.
6.  **OAuth Client Lib -> Stores:** The `nodeOAuthClient` interacts with the registered `IOAuthStateStore` (to validate state) and `IOAuthSessionStore` (to save the new tokens/session keyed by the user's DID (`sub`)).
7.  **OAuth Processor -> Use Case:** The `IOAuthProcessor` returns the authenticated user's DID (and potentially other session info) to the use case.
8.  **Use Case -> Repository:** The use case calls `IUserRepository.findById(did)`.
9.  **Repository -> DB:** The `UserRepository` queries the database.
10. **Use Case:** If user exists, updates `lastLoginAt`. If not, creates a new `User` aggregate instance with the DID, fetches handle (optional), sets `linkedAt`, `lastLoginAt`.
11. **Use Case -> Repository:** Calls `IUserRepository.save(user)`.
12. **Repository -> DB:** Inserts or updates the user record in the database.
13. **Use Case -> Event Dispatcher:** Dispatches `UserAccountLinked` or `UserLoggedIn`.
14. **Use Case -> Controller:** Returns `UserOutputDTO` (or session identifier).
15. **Controller -> User:** Sends response (e.g., redirect, set cookie).
