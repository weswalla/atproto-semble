// Re-exporting or defining the type expected by @atproto/oauth-client-node
// Ensure this structure matches NodeSavedState if re-exporting isn't desired.
export interface OAuthStateData {
  code_verifier: string;
  state?: string | undefined;
  // Add other fields if the library includes them
}

/**
 * Interface for storing temporary OAuth state data required by the OAuth client library.
 * Matches the structure expected by `@atproto/oauth-client-node`.
 */
export interface IOAuthStateStore {
  /**
   * Retrieves state data associated with a given key (typically the 'state' parameter).
   * @param key The state key.
   * @returns The stored state data or undefined if not found or expired.
   */
  get(key: string): Promise<OAuthStateData | undefined>;

  /**
   * Stores state data associated with a given key. Implementations should consider setting a TTL.
   * @param key The state key.
   * @param state The state data to store.
   */
  set(key: string, state: OAuthStateData): Promise<void>;

  /**
   * Deletes state data associated with a given key.
   * @param key The state key.
   */
  del(key: string): Promise<void>;
}
