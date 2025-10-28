import { RuntimeLock } from '@atproto/oauth-client-node';
import Redis from 'ioredis';
import { ILockService } from './ILockService';

export class RedisLockService implements ILockService {
  constructor(private redis: Redis) {}

  createRequestLock(): RuntimeLock {
    return async (key: string, fn: () => Promise<any>) => {
      const lockKey = `oauth:lock:${key}`;
      const lockValue = `${Date.now()}-${Math.random()}`;
      const lockTTL = 45; // 45 seconds (as recommended in docs)

      // Try to acquire lock
      const acquired = await this.redis.set(
        lockKey,
        lockValue,
        'PX',
        lockTTL * 1000,
        'NX'
      );

      if (!acquired) {
        // Wait and retry if lock is held
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.createRequestLock()(key, fn);
      }

      try {
        return await fn();
      } finally {
        // Release lock only if we still own it
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        await this.redis.eval(script, 1, lockKey, lockValue);
      }
    };
  }
}
