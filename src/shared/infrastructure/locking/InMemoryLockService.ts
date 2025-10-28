import { RuntimeLock } from '@atproto/oauth-client-node';
import { ILockService } from './ILockService';

interface LockInfo {
  expiresAt: number;
  promise: Promise<any>;
}

export class InMemoryLockService implements ILockService {
  private locks = new Map<string, LockInfo>();

  constructor() {
    // Clean up expired locks every 30 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [key, lock] of this.locks.entries()) {
        if (now > lock.expiresAt) {
          this.locks.delete(key);
        }
      }
    }, 30000);
  }

  createRequestLock(): RuntimeLock {
    return async (key: string, fn: () => any) => {
      const lockKey = `oauth:lock:${key}`;
      const now = Date.now();
      const expiresAt = now + 45000; // 45 seconds

      // Check if lock exists and is still valid
      const existingLock = this.locks.get(lockKey);
      if (existingLock && now < existingLock.expiresAt) {
        // Wait for existing lock to complete, then retry
        try {
          await existingLock.promise;
        } catch {
          // Ignore errors from other processes
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        return this.createRequestLock()(key, fn);
      }

      // Create new lock
      const lockPromise = this.executeLocked(fn);
      this.locks.set(lockKey, {
        expiresAt,
        promise: lockPromise,
      });

      try {
        return await lockPromise;
      } finally {
        // Clean up lock if it's still ours
        const currentLock = this.locks.get(lockKey);
        if (currentLock?.promise === lockPromise) {
          this.locks.delete(lockKey);
        }
      }
    };
  }

  private async executeLocked<T>(fn: () => Promise<T>): Promise<T> {
    return await fn();
  }
}
