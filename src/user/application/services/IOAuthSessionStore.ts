// Re-exporting or defining the type expected by @atproto/oauth-client-node
// This avoids a direct dependency from the Application layer interface to the library type.
// Ensure this structure matches NodeSavedSession if re-exporting isn't desired.
export interface OAuthSessionData {
  access_token: string;
  refresh_token?: string | undefined;
  scope: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in?: number | undefined;
  did: string;
  handle?: string | undefined;
  // Add other fields if the library includes them
}

/**
 * Interface for storing OAuth session data required by the OAuth client library.
 * Matches the structure expected by `@atproto/oauth-client-node`.
 */
export interface IOAuthSessionStore {
  /**
   * Retrieves session data for a given subject (user DID).
   * @param sub The user's DID.
   * @returns The stored session data or undefined if not found.
   */
  get(sub: string): Promise<OAuthSessionData | undefined>;

  /**
   * Stores or updates session data for a given subject (user DID).
   * @param sub The user's DID.
   * @param session The session data to store.
   */
  set(sub: string, session: OAuthSessionData): Promise<void>;

  /**
   * Deletes session data for a given subject (user DID).
   * @param sub The user's DID.
   */
  del(sub: string): Promise<void>;
}
