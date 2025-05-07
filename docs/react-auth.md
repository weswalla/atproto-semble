# Using React with the Current Authentication Setup

This document outlines considerations and patterns for integrating a React frontend with the existing Express backend's authentication system, which relies on `iron-session` and `HttpOnly` cookies.

## Core Principles:

1.  **`HttpOnly` Cookies Remain Server-Managed:**
    *   The `HttpOnly` session cookie (e.g., `sid`) set by the backend will continue to be the primary mechanism for session persistence.
    *   The browser will automatically send this cookie with API requests to the backend.
    *   React client-side code **cannot and should not** attempt to directly access or manipulate this `HttpOnly` cookie.

2.  **Client-Side Authentication State:**
    *   While the browser handles the cookie, the React application needs its own internal state to know if a user is authenticated and who the user is. This state will drive UI changes (e.g., showing user-specific content, login/logout buttons).

## Recommended Patterns:

1.  **Dedicated API Endpoint for User Data (`/api/me`):**
    *   Create a new backend endpoint (e.g., `/api/me`).
    *   This endpoint should use the existing `getSessionAgent` logic (or similar) to check for a valid session cookie.
    *   If authenticated, it should return relevant user information (e.g., DID, display name, profile details).
    *   If not authenticated, it should return an appropriate error (e.g., 401 Unauthorized).

2.  **Fetching User Data on App Load:**
    *   When the React app initializes, it should make a request to the `/api/me` endpoint.
    *   Based on the response, the React app updates its internal authentication state (e.g., in React Context, Redux, Zustand, or component state).

3.  **Login Flow:**
    *   The React app's login button/action should redirect the browser to the backend's existing `/login` route (e.g., `window.location.href = '/login'`).
    *   The backend handles the entire OAuth flow and sets the `HttpOnly` session cookie upon successful authentication.
    *   After the OAuth callback, the backend should redirect the user back to the React application (e.g., to the main page or a specific post-login page).
    *   Upon returning to the React app, it can either re-fetch from `/api/me` or the backend redirect could include a signal for the app to know the login was successful, prompting a fetch to `/api/me`.

4.  **Logout Flow:**
    *   The React app's logout button/action should make an API call (e.g., `POST`) to the backend's existing `/logout` route.
    *   The backend destroys the `iron-session`, clearing the `HttpOnly` cookie.
    *   Upon a successful response from the logout API, the React app should clear its internal authentication state and update the UI.

5.  **Authenticated API Calls from React:**
    *   When making other API calls to protected backend routes (e.g., posting a status), React's `fetch` or `axios` calls will automatically include the `HttpOnly` session cookie if the requests are to the same domain (or if CORS and `credentials: 'include'` are correctly configured for cross-domain scenarios).
    *   No special handling is needed in the React code to attach the session cookie itself.

6.  **UI Updates:**
    *   The React app uses its internal authentication state to conditionally render UI elements:
        *   Show user profile / logout button if authenticated.
        *   Show login button if not authenticated.
        *   Enable/disable features based on authentication status.

## Example Workflow:

1.  **User opens React App:**
    *   React app calls `GET /api/me`.
    *   Browser automatically sends `sid` cookie if present.
    *   Backend validates cookie:
        *   If valid: Returns user data (e.g., `{ did: '...', displayName: '...' }`). React app sets `user` state.
        *   If invalid/missing: Returns 401. React app sets `user` state to `null`.
2.  **User clicks "Login":**
    *   React app redirects to `GET /login` on the backend.
    *   Backend initiates OAuth, user authenticates with PDS.
    *   Backend's `/oauth/callback` receives PDS response, creates `iron-session`, sets `sid` cookie.
    *   Backend redirects back to React app (e.g., `https://your-react-app.com/`).
    *   React app (on load or via a specific effect) calls `GET /api/me` again, gets user data, updates UI.
3.  **User clicks "Post Status":**
    *   React app makes `POST /status` request to backend with status data.
    *   Browser automatically sends `sid` cookie.
    *   Backend's `/status` route uses `getSessionAgent` to validate session and process the request.
4.  **User clicks "Logout":**
    *   React app calls `POST /logout` on the backend.
    *   Backend destroys `iron-session`, clearing the `sid` cookie.
    *   React app clears its local `user` state, updates UI.

This approach leverages the security of `HttpOnly` cookies managed by the server while allowing the React SPA to maintain its own awareness of the authentication state for a responsive user experience.
