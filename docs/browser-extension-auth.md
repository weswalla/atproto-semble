# Browser Extension Authentication Guide

Authenticating a browser extension with a backend service requires a different approach than traditional web applications that rely on HttpOnly session cookies. Due to the extension's unique origin (`chrome-extension://your-extension-id` or similar), a token-based authentication flow is generally more robust and secure.

This guide outlines the steps to implement such a flow.

## 1. Shift to Token-Based Authentication

Instead of session cookies, your extension will manage authentication tokens explicitly:
*   **Access Token:** A short-lived token used to authorize API requests.
*   **Refresh Token:** A long-lived token used to obtain a new access token when the current one expires, avoiding frequent re-logins.

Your backend will issue these tokens upon successful user authentication.

## 2. Authentication Initiation and Token Acquisition

The extension initiates the login process, typically via an OAuth 2.0 flow.

*   **Login Trigger:** A user action (e.g., clicking a "Login" button) in the extension's UI (popup or options page).
*   **OAuth Flow with `launchWebAuthFlow`:**
    *   Use `chrome.identity.launchWebAuthFlow` (or `browser.identity.launchWebAuthFlow` for Firefox/other browsers supporting the WebExtensions API). This API is specifically designed for extensions to handle web-based authentication flows.
    *   **Invocation:**
        ```javascript
        // In your extension's background script or popup script

        // 1. Construct the backend URL that will initiate the OAuth flow with the PDS.
        // This backend URL should specify the *extension's* callback URL as a parameter
        // so the backend knows where to redirect after PDS authentication.
        // The backend's /login route (or a new one like /oauth/extension/initiate)
        // will then redirect to the PDS, including its own /oauth/extension/callback
        // as the redirect_uri for the PDS.

        // Example: The extension wants to be called back at `extensionCallbackUrl`.
        // The backend has an endpoint `/login` which takes `final_redirect_uri` for the extension.
        const pdsHandle = "bsky.social"; // Or user-provided
        const backendLoginUrl = `https://your-backend.com/login?handle=${encodeURIComponent(pdsHandle)}&target_link_uri=${encodeURIComponent(chrome.identity.getRedirectURL("callback"))}`;
        // Note: The backend's /login route would need modification to accept `target_link_uri`
        // and pass it through its own PDS authorization call, or use a dedicated initiation endpoint.
        // For simplicity, the current /login route in `src/routes.ts` doesn't support this `target_link_uri` directly for extension flow.
        // A more direct approach for the extension might be to construct the PDS auth URL itself,
        // ensuring the `redirect_uri` for the PDS is `https://your-backend.com/oauth/extension/callback`.

        // Assuming the backend's `/login` or a similar endpoint initiates the PDS OAuth flow
        // and is configured to use `https://your-backend.com/oauth/extension/callback` as its redirect_uri with the PDS.
        // The extension then calls `launchWebAuthFlow` targeting the PDS directly or via a backend initiator.
        // For this example, let's assume the extension calls a backend endpoint that starts the flow.
        // The backend's `oauthClient.authorize()` in `src/routes.ts` (e.g., in POST /login)
        // will use the `redirect_uris` configured in `src/auth/client.ts`, one of which is
        // for `/oauth/extension/callback`.

        const backendInitiationUrl = `https://your-backend.com/login`; // This needs to be a POST or handle selection.
                                                                    // Or a dedicated GET endpoint for extension.

        // A more direct PDS URL construction (if client_id is known or discoverable):
        // const clientId = `https://your-backend.com/client-metadata.json`;
        // const pdsAuthUrl = `https://${pdsHandle}/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent('https://your-backend.com/oauth/extension/callback')}&scope=atproto%20transition%3Ageneric&state=YOUR_STATE_HERE`;

        // For this example, let's assume `backendInitiationUrl` correctly starts the flow
        // leading to `https://your-backend.com/oauth/extension/callback`
        chrome.identity.launchWebAuthFlow(
          {
            url: authUrl,
            interactive: true, // Prompts the user for login if necessary
          },
          (callbackUrl) => {
            if (chrome.runtime.lastError || !callbackUrl) {
              console.error("Authentication failed:", chrome.runtime.lastError?.message);
              // Handle authentication error (e.g., user cancelled)
              return;
            }
            // Example callbackUrl: https://<your-extension-id>.chromiumapp.org/callback#access_token=XYZ&refresh_token=ABC&expires_in=3600
            // Or query params: https://<your-extension-id>.chromiumapp.org/callback?code=AUTH_CODE
            // The format depends on how your backend/OAuth provider returns tokens/codes.
            extractTokensFromCallback(callbackUrl);
          }
        );
        ```
    *   **Redirect URI Flow:**
        1.  The extension initiates the OAuth flow using `chrome.identity.launchWebAuthFlow`. The URL provided to `launchWebAuthFlow` should ultimately lead to the PDS authorization endpoint.
        2.  The PDS is configured (via your backend's client registration) to redirect to your backend's specific extension callback: `https://your-backend.com/oauth/extension/callback`.
        3.  Your backend's `/oauth/extension/callback` (in `src/routes.ts`) handles the code exchange with the PDS, retrieves the PDS access/refresh tokens, and stores the PDS session details (including refresh token) in its `SessionStore` (linked to the user's DID).
        4.  Crucially, this backend endpoint then redirects *back to the extension's internal callback URL* (e.g., `https://<extension-id>.chromiumapp.org/callback` obtained via `chrome.identity.getRedirectURL("callback")`). This redirect includes the PDS access token, refresh token, DID, and expiry information in the URL fragment (`#`).
    *   **Token Extraction by Extension:** `launchWebAuthFlow` captures this final redirect to the extension's internal callback. Your extension code then parses the tokens and other details from the URL fragment.
        ```javascript
        // In the callback function of launchWebAuthFlow
        function extractTokensFromCallback(callbackUrlString) {
          const url = new URL(callbackUrlString);
          const params = new URLSearchParams(url.hash.substring(1)); // Remove '#'
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const did = params.get('did');
          const expiresIn = params.get('expires_in'); // String, in seconds

          if (accessToken && did) {
            saveTokens(accessToken, refreshToken, did, expiresIn);
          } else {
            console.error("Failed to extract tokens from callback URL:", callbackUrlString);
            // Handle error
          }
        }
        ```

## 3. Persistent Tokens and Data Storage

Store tokens securely and persistently within the extension.

*   **Tokens to Persist:**
    *   Access Token
    *   Refresh Token
    *   User's DID (Decentralized Identifier) or other relevant user information.
*   **Storage Mechanism:** Use `chrome.storage.local` (or `browser.storage.local`). This is an asynchronous API designed for extension data storage.
    ```javascript
    // Storing tokens after successful extraction
    function saveTokens(accessToken, refreshToken, userDid, expiresInString) {
      const expiresIn = expiresInString ? parseInt(expiresInString, 10) : 3600; // Default to 1 hour if not provided
      chrome.storage.local.set({
        accessToken: accessToken,
        refreshToken: refreshToken, // May be null or empty if PDS doesn't return it directly here
        userDid: userDid,
        tokenExpiry: Date.now() + (expiresIn * 1000)
      }, () => {
        console.log('Tokens and user DID stored.');
        // Update UI, enable authenticated features
      });
    }

    // Retrieving tokens
    chrome.storage.local.get(['accessToken', 'refreshToken', 'userDid'], (result) => {
      if (result.accessToken) {
        // User is likely logged in
      }
    });
    ```

## 4. Making Authenticated API Calls

Include the access token in the `Authorization` header for requests to your protected backend APIs.

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['accessToken', 'tokenExpiry'], async (result) => {
      if (!result.accessToken) {
        return reject(new Error('Not authenticated. No access token found.'));
      }

      // Optional: Proactive token refresh if expiry is near
      // if (result.tokenExpiry && Date.now() >= result.tokenExpiry - (5 * 60 * 1000) /* 5 mins buffer */) {
      //   try {
      //     await refreshAccessToken(); // Implement this function (see section 5)
      //     // After refresh, get the new token
      //     chrome.storage.local.get(['accessToken'], (refreshedResult) => {
      //       if (!refreshedResult.accessToken) return reject(new Error('Token refresh failed.'));
      //       sendRequest(url, options, refreshedResult.accessToken, resolve, reject);
      //     });
      //     return;
      //   } catch (refreshError) {
      //     return reject(refreshError);
      //   }
      // }

      sendRequest(url, options, result.accessToken, resolve, reject);
    });
  });
}

async function sendRequest(url, options, token, resolve, reject) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json', // Or other appropriate content type
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Access token might be expired or invalid
      // Attempt to refresh the token (see section 5)
      // For simplicity, here we just reject. A robust implementation would trigger refresh.
      return reject(new Error('Unauthorized. Token may be expired.'));
    }
    if (!response.ok) {
      const errorData = await response.text();
      return reject(new Error(`API request failed: ${response.status} ${errorData}`));
    }
    resolve(await response.json()); // Or response.text(), etc.
  } catch (error) {
    reject(error);
  }
}

// Usage:
// makeAuthenticatedRequest('https://your-backend.com/api/status', {
//   method: 'POST',
//   body: JSON.stringify({ status: 'Hello from extension!' })
// })
// .then(data => console.log('Status posted:', data))
// .catch(error => console.error('Error posting status:', error));
```

## 5. Token Refresh

Access tokens are short-lived. Implement a mechanism to use the refresh token to obtain a new access token when the current one expires.

*   **Trigger:** An API call fails with a 401 Unauthorized status.
*   **Process:**
    1.  Retrieve the refresh token from `chrome.storage.local`.
    2.  Make a request to your backend's token refresh endpoint (e.g., `/oauth/refresh`), sending the refresh token.
    3.  Your backend validates the refresh token and, if valid, issues a new access token (and potentially a new refresh token).
    4.  Store the new token(s) in `chrome.storage.local`.
    5.  Retry the original API request that failed.

```javascript
async function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['refreshToken', 'userDid'], async (result) => {
      if (!result.refreshToken || !result.userDid) {
        // The refresh token might have been initially empty if the PDS didn't return it directly
        // to the extension. The backend's SessionStore holds the authoritative refresh token.
        // The extension needs the DID to ask the backend to use its stored refresh token.
        return reject(new Error('No refresh token or user DID available for refresh. User may need to re-authenticate.'));
      }

      try {
        // The extension sends its stored PDS refresh token (if it has one) AND the user's DID.
        // The backend's /oauth/refresh endpoint will primarily use the DID to look up
        // the authoritative PDS session (including refresh token) from its SessionStore.
        const response = await fetch('https://your-backend.com/oauth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: result.refreshToken, did: result.userDid })
        });

        if (!response.ok) {
          // Refresh failed (e.g., refresh token expired or revoked)
          // Log out the user
          await handleLogout();
          return reject(new Error('Failed to refresh access token.'));
        }

        const { accessToken, refreshToken: newRefreshToken, expiresIn } = await response.json();
        // Update stored tokens
        const updatedTokens = { accessToken };
        if (newRefreshToken) updatedTokens.refreshToken = newRefreshToken; // If backend rotates refresh tokens
        if (expiresIn) updatedTokens.tokenExpiry = Date.now() + (expiresIn * 1000);

        chrome.storage.local.set(updatedTokens, () => {
          console.log('Access token refreshed.');
          resolve();
        });
      } catch (error) {
        console.error('Error refreshing token:', error);
        reject(error);
      }
    });
  });
}
```
**Note:** Implement a queueing mechanism for concurrent API calls if a token refresh is in progress to avoid multiple refresh attempts.

## 6. Logout

Clear stored tokens and any other user-specific data.

```javascript
async function handleLogout() {
  // Optional: Inform the backend to invalidate the refresh token, if supported
  // try {
  //   chrome.storage.local.get(['refreshToken'], async (result) => {
  //     if (result.refreshToken) {
  //       await fetch('https://your-backend.com/oauth/revoke', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ token: result.refreshToken, token_type_hint: 'refresh_token' })
  //       });
  //     }
  //   });
  // } catch (error) {
  //   console.warn('Failed to revoke token on backend during logout:', error);
  // }

  chrome.storage.local.remove(['accessToken', 'refreshToken', 'userDid', 'tokenExpiry'], () => {
    console.log('User logged out, tokens removed.');
    // Update UI to reflect logged-out state
  });
}
```

## 7. Backend Adjustments

Your backend will need to:

*   **OAuth Client Configuration (`src/auth/client.ts`):**
    *   The `redirect_uris` array in `NodeOAuthClient` configuration must include your backend's specific callback URL for extensions (e.g., `https://your-backend.com/oauth/extension/callback`).
*   **Extension OAuth Callback (`/oauth/extension/callback` in `src/routes.ts`):**
    *   This new backend route handles the redirect from the PDS after successful user authentication.
    *   It uses `ctx.oauthClient.callback(params)` to exchange the authorization code for PDS tokens (access and refresh).
    *   Crucially, `oauthClient.callback()` also saves the full PDS session (including the refresh token) into the backend's `SessionStore`, associated with the user's DID. This is vital for later token refreshes initiated by the backend.
    *   Instead of setting an `iron-session` cookie (like the web flow), this endpoint redirects the user's browser (within the `launchWebAuthFlow` popup) to the extension's internal callback URL (e.g., `https://<extension-id>.chromiumapp.org/callback`).
    *   This redirect includes the PDS `access_token`, `refresh_token` (if provided by PDS), `did`, `expires_in`, etc., in the URL fragment (`#`), for the extension to parse.
*   **Bearer Token Authentication (`getSessionAgent` in `src/routes.ts`):**
    *   The `getSessionAgent` function (or a similar middleware for authenticated routes) is modified to check for an `Authorization: Bearer <token>` header.
    *   If a Bearer token (which is the PDS access token sent by the extension) is present:
        *   The backend should ideally decode and validate this JWT to extract the user's `did` (e.g., from the `sub` claim). This requires a JWT library like `jose`. (Currently, this part is a placeholder in `src/routes.ts` and needs full implementation).
        *   Once the `did` is obtained, `ctx.oauthClient.restore(did)` is called. This function leverages the `SessionStore` (where the PDS refresh token is stored) to obtain a valid AT Protocol `Agent`. If the PDS access token provided by the extension is expired, `restore(did)` will automatically attempt to use the stored PDS refresh token to get a new PDS access token.
*   **Token Refresh Endpoint (`/oauth/refresh` in `src/routes.ts`):**
    *   This new `POST` endpoint allows the extension to request a new PDS access token.
    *   The extension sends its stored PDS `refreshToken` (if it has one) and the `did`.
    *   The backend uses the `did` to call `ctx.oauthClient.sessionStore.refresh(did, true)`. This method uses the authoritative refresh token stored in the backend's `SessionStore` for that DID to get a new PDS access token.
    *   The new PDS `access_token` and its `expires_in` are returned to the extension.
*   **CORS Configuration:**
    *   The backend must be configured with Cross-Origin Resource Sharing (CORS) middleware to allow requests from your extension's origin (e.g., `chrome-extension://<your-extension-id>`). This is typically set up in `src/index.ts`.
*   **Environment Variables:**
    *   An environment variable like `EXTENSION_ID` (used in `src/routes.ts` for constructing the extension's redirect URI) needs to be configured.

By following these steps, and implementing the necessary JWT validation, you can create a secure and robust authentication system for your browser extension, leveraging the backend's capability to manage PDS refresh tokens effectively.
