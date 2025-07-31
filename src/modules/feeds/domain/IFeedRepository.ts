import { Result } from '../../../shared/core/Result';
import { Activity } from './Activity';
import { ActivityId } from './value-objects/ActivityId';

export interface FeedQueryOptions {
  page: number;
  limit: number;
  beforeActivityId?: ActivityId; // For cursor-based pagination
}

export interface PaginatedFeedResult {
  activities: Activity[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: ActivityId; // For cursor-based pagination
}

export interface IFeedRepository {
  addActivity(activity: Activity): Promise<Result<void>>;
  getGlobalFeed(options: FeedQueryOptions): Promise<Result<PaginatedFeedResult>>;
  findById(activityId: ActivityId): Promise<Result<Activity | null>>;
}
