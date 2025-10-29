import Redis from 'ioredis';
import {
  IProfileService,
  UserProfile,
} from 'src/modules/cards/domain/services/IProfileService';
import { Result, ok } from 'src/shared/core/Result';

export class CachedBlueskyProfileService implements IProfileService {
  private readonly CACHE_TTL_SECONDS = 3600 * 12; // 12 hours
  private readonly CACHE_KEY_PREFIX = 'profile:';

  constructor(
    private readonly profileService: IProfileService,
    private readonly redis: Redis,
  ) {}

  async getProfile(
    userId: string,
    callerId?: string,
  ): Promise<Result<UserProfile>> {
    const cacheKey = this.getCacheKey(userId);

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try {
          const profile = JSON.parse(cached) as UserProfile;
          return ok(profile);
        } catch (parseError) {
          // If JSON parsing fails, continue to fetch fresh data
          console.warn(
            `Failed to parse cached profile for ${userId}:`,
            parseError,
          );
        }
      }

      // Cache miss or parse error - fetch from underlying service
      const result = await this.profileService.getProfile(userId, callerId);

      if (result.isOk()) {
        // Cache the successful result
        try {
          await this.redis.setex(
            cacheKey,
            this.CACHE_TTL_SECONDS,
            JSON.stringify(result.value),
          );
        } catch (cacheError) {
          // Log cache error but don't fail the request
          console.warn(`Failed to cache profile for ${userId}:`, cacheError);
        }
      }

      return result;
    } catch (redisError) {
      // If Redis is down, fall back to direct service call
      console.warn(
        `Redis error when fetching profile for ${userId}:`,
        redisError,
      );
      return this.profileService.getProfile(userId, callerId);
    }
  }

  private getCacheKey(userId: string): string {
    return `${this.CACHE_KEY_PREFIX}${userId}`;
  }

  /**
   * Invalidate cached profile for a specific user
   */
  async invalidateProfile(userId: string): Promise<void> {
    try {
      await this.redis.del(this.getCacheKey(userId));
    } catch (error) {
      console.warn(`Failed to invalidate profile cache for ${userId}:`, error);
    }
  }

  /**
   * Warm the cache by pre-fetching a profile
   */
  async warmCache(userId: string, callerId?: string): Promise<void> {
    await this.getProfile(userId, callerId);
  }
}
