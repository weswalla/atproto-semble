export interface ISagaStateStore {
  /**
   * Get the value for a key
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a key-value pair with expiration in seconds
   */
  setex(key: string, ttlSeconds: number, value: string): Promise<void>;

  /**
   * Delete a key
   */
  del(key: string): Promise<void>;

  /**
   * Set a key with options (for distributed locking)
   * Returns 'OK' if successful, null otherwise
   */
  set(
    key: string,
    value: string,
    mode: 'EX',
    ttl: number,
    flag: 'NX',
  ): Promise<'OK' | null>;
}
