import { Result, ok, err } from '../../../../shared/core/Result';
import {
  IFeedRepository,
  FeedQueryOptions,
  PaginatedFeedResult,
} from '../../domain/IFeedRepository';
import { FeedActivity } from '../../domain/FeedActivity';
import { ActivityId } from '../../domain/value-objects/ActivityId';

export class InMemoryFeedRepository implements IFeedRepository {
  private activities: FeedActivity[] = [];

  async addActivity(activity: FeedActivity): Promise<Result<void>> {
    try {
      console.log('InMemoryFeedRepository: Adding activity', activity);
      this.activities.push(activity);
      console.log('Total Activities:', this.activities.length);
      // Sort by creation time descending
      this.activities.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      console.log('Activities after addition:', this.activities);
      return ok(undefined);
    } catch (error) {
      return err(error as Error);
    }
  }

  async getGlobalFeed(
    options: FeedQueryOptions,
  ): Promise<Result<PaginatedFeedResult>> {
    try {
      console.log(
        'InMemoryFeedRepository: Getting global feed with options',
        options,
      );
      console.log('Total Activities:', this.activities.length);
      const { page, limit, beforeActivityId } = options;
      let filteredActivities = [...this.activities];

      // Filter by cursor if provided
      if (beforeActivityId) {
        const beforeIndex = filteredActivities.findIndex((activity) =>
          activity.activityId.equals(beforeActivityId),
        );
        if (beforeIndex >= 0) {
          filteredActivities = filteredActivities.slice(beforeIndex + 1);
        }
      }

      // Paginate
      const offset = (page - 1) * limit;
      const paginatedActivities = filteredActivities.slice(
        offset,
        offset + limit,
      );

      const totalCount = this.activities.length;
      const hasMore = offset + paginatedActivities.length < totalCount;

      let nextCursor: ActivityId | undefined;
      if (hasMore && paginatedActivities.length > 0) {
        nextCursor =
          paginatedActivities[paginatedActivities.length - 1]!.activityId;
      }

      return ok({
        activities: paginatedActivities,
        totalCount,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      return err(error as Error);
    }
  }

  async findById(activityId: ActivityId): Promise<Result<FeedActivity | null>> {
    try {
      const activity = this.activities.find((a) =>
        a.activityId.equals(activityId),
      );
      return ok(activity || null);
    } catch (error) {
      return err(error as Error);
    }
  }

  // Test helper methods
  clear(): void {
    this.activities = [];
  }

  getAll(): FeedActivity[] {
    return [...this.activities];
  }
}
