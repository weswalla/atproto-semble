import Redis from 'ioredis';
import { ISagaStateStore } from '../application/sagas/ISagaStateStore';

export class RedisSagaStateStore implements ISagaStateStore {
  constructor(private redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.redis.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async set(
    key: string,
    value: string,
    mode: 'EX',
    ttl: number,
    flag: 'NX',
  ): Promise<'OK' | null> {
    const result = await this.redis.set(key, value, mode, ttl, flag);
    return result === 'OK' ? 'OK' : null;
  }
}
