import { RuntimeLock } from '@atproto/oauth-client-node';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { ILockService } from './ILockService';

export class RedisLockService implements ILockService {
  private redlock: Redlock;

  constructor(private redis: Redis) {
    this.redlock = new Redlock([redis], {
      // Retry settings
      retryCount: 3,
      retryDelay: 200, // ms
      retryJitter: 200, // ms
    });
  }

  createRequestLock(): RuntimeLock {
    return async (key: string, fn: () => any) => {
      const lockKey = `oauth:lock:${key}`;

      // 45 seconds as recommended in the docs
      const lock = await this.redlock.acquire([lockKey], 45000);

      try {
        return await fn();
      } finally {
        await this.redlock.release(lock);
      }
    };
  }
}
