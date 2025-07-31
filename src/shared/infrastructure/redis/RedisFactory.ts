import Redis from 'ioredis';

export class RedisFactory {
  private static instance: Redis | null = null;
  static createConnection(redisUrl: string): Redis {
    if (!this.instance) {
      this.instance = new Redis(redisUrl, { maxRetriesPerRequest: null });
    }
    return this.instance;
  }
}
