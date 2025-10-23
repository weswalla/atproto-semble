import { ISagaStateStore } from '../application/sagas/ISagaStateStore';

interface StoredItem {
  value: string;
  expiry: number;
}

export class InMemorySagaStateStore implements ISagaStateStore {
  private store = new Map<string, StoredItem>();
  private locks = new Set<string>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item || Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiry });

    // Clean up expired items after TTL
    setTimeout(() => {
      const item = this.store.get(key);
      if (item && Date.now() > item.expiry) {
        this.store.delete(key);
      }
    }, ttlSeconds * 1000);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.locks.delete(key);
  }

  async set(
    key: string,
    value: string,
    mode: 'EX',
    ttl: number,
    flag: 'NX',
  ): Promise<'OK' | null> {
    if (flag === 'NX' && this.locks.has(key)) {
      return null; // Lock already exists
    }

    this.locks.add(key);
    
    // Auto-expire the lock after TTL
    setTimeout(() => {
      this.locks.delete(key);
    }, ttl * 1000);

    return 'OK';
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.store.clear();
    this.locks.clear();
  }
}
