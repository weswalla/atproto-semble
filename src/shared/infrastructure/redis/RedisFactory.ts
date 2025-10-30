import Redis from 'ioredis';

export class RedisFactory {
  static createConnection(redisConfig: {
    host: string;
    port: number;
    password?: string;
    maxRetriesPerRequest: number | null;
  }): Redis {
    return new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      username: 'default',
      family: 6,
    });
  }
}
