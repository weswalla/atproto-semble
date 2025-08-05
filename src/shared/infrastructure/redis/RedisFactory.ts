import Redis from 'ioredis';

export class RedisFactory {
  private static instance: Redis | null = null;
  static createConnection(redisConfig: {
    host: string;
    port: number;
    password?: string;
    maxRetriesPerRequest: number | null;
  }): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
        username: 'default',
        family: 6,
      });
    }
    return this.instance;
  }
}
