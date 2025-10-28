import { ILockService } from './ILockService';
import { RedisLockService } from './RedisLockService';
import { InMemoryLockService } from './InMemoryLockService';
import { RedisFactory } from '../redis/RedisFactory';
import { EnvironmentConfigService, Environment } from '../config/EnvironmentConfigService';

export class LockServiceFactory {
  static create(): ILockService {
    const config = new EnvironmentConfigService();
    const environment = config.get().environment;

    // Use Redis in production/dev, in-memory for local/testing
    if (environment === Environment.PROD || environment === Environment.DEV) {
      try {
        const redis = RedisFactory.createConnection({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          maxRetriesPerRequest: null,
        });
        
        return new RedisLockService(redis);
      } catch (error) {
        console.warn('Failed to connect to Redis, falling back to in-memory locks:', error);
        return new InMemoryLockService();
      }
    }

    return new InMemoryLockService();
  }
}
