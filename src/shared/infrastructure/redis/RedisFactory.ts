import Redis from 'ioredis';

export class RedisFactory {
  static createConnection(redisUrl?: string): Redis {
    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    
    return new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });
  }
}
