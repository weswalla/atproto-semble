# Authentication Approach Summary

This document outlines the authentication mechanism used in this AT Protocol Express application.

## Core Components and Flow:

1.  **OAuth 2.0 with AT Protocol:**
    - The primary authentication method is OAuth 2.0, delegating user authentication to their chosen AT Protocol PDS (Personal Data Server).
    - The application acts as an OAuth client, configured in `src/auth/client.ts` using `@atproto/oauth-client-node`.
    - The flow typically starts when a user attempts to log in via the `/login` route.

2.  **Session Management with `iron-session`:**
    - Once the user successfully authenticates with their PDS via the OAuth flow, the `/oauth/callback` route is invoked.
    - This callback handler uses `ctx.oauthClient.callback(params)` to finalize the OAuth exchange and retrieve an AT Protocol session (which includes the user's DID and potentially access/refresh tokens for the PDS).
    - Crucially, the user's `did` is then stored in a server-side session managed by `iron-session`.
    - `iron-session` encrypts this session data (containing the `did`) and stores it in an HTTP cookie (named `sid` by default in `src/routes.ts`). This cookie is sent to the client's browser.

3.  **Cookie-Based Session Persistence:**
    - The browser automatically includes the `sid` cookie in subsequent requests to the server.
    - This cookie is `HttpOnly` (a default and recommended practice for `iron-session`), meaning it's not accessible to client-side JavaScript, enhancing security against XSS attacks.

4.  **Session Restoration and AT Protocol Agent:**
    - For requests requiring authentication (e.g., posting a status, viewing personalized content), the `getSessionAgent` helper function in `src/routes.ts` is used.
    - `getSessionAgent` retrieves the `did` from the `iron-session` cookie.
    - It then uses `ctx.oauthClient.restore(session.did)` to restore the full AT Protocol OAuth session. This step might involve using stored refresh tokens (managed by `SessionStore` in `src/auth/storage.ts`) to obtain fresh access tokens for interacting with the user's PDS.
    - If restoration is successful, an `Agent` from `@atproto/api` is instantiated. This agent is then used to make authenticated requests to the user's PDS on their behalf.

5.  **Storage (`src/auth/storage.ts`):**
    - `StateStore`: Persists OAuth state parameters during the authorization code flow to prevent CSRF attacks.
    - `SessionStore`: Persists the AT Protocol OAuth session details (including access tokens, refresh tokens, and scopes) associated with a user's DID. This allows `oauthClient.restore()` to reconstruct an active PDS session.
    - Both stores use the application's database (SQLite by default) for persistence.

## Key Routes in `src/routes.ts`:\*\*

- **`/login` (GET & POST):** Initiates the OAuth flow by redirecting the user to their PDS for authentication.
- **`/oauth/callback` (GET):** Handles the redirect from the PDS after authentication. Exchanges the authorization code for tokens (handled by `oauthClient`), and then establishes the `iron-session` by storing the user's `did`.
- **`/logout` (POST):** Destroys the `iron-session`, effectively logging the user out by clearing the session cookie.
- **Authenticated Routes (e.g., `/status` POST, `/` GET for logged-in users):** Use `getSessionAgent` to retrieve an authenticated AT Protocol agent.

## Summary of Technologies:

- **OAuth 2.0:** Standard for delegated authentication.
- **AT Protocol SDK (`@atproto/oauth-client-node`, `@atproto/api`):** For interacting with the AT Protocol network and PDS.
- **`iron-session`:** For server-side session management with encrypted cookies.
- **HTTP Cookies (`HttpOnly`):** For persisting session identifiers on the client-side securely.
- **Express.js:** As the web server framework.
