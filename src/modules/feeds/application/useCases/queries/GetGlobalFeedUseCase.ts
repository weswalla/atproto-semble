import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IFeedRepository } from '../../../domain/IFeedRepository';
import { ActivityId } from '../../../domain/value-objects/ActivityId';
import { ActivityTypeEnum } from '../../../domain/value-objects/ActivityType';
import { IProfileService } from '../../../../cards/domain/services/IProfileService';
import { ICardQueryRepository, UrlCardView } from '../../../../cards/domain/ICardQueryRepository';
import { ICollectionQueryRepository } from '../../../../cards/domain/ICollectionQueryRepository';
import { CardTypeEnum } from '../../../../cards/domain/value-objects/CardType';

export interface GetGlobalFeedQuery {
  page?: number;
  limit?: number;
  beforeActivityId?: string; // For cursor-based pagination
}

// DTOs for the response
export interface FeedItemView {
  id: string;
  user: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
  };
  card: UrlCardView;
  collections: {
    id: string;
    name: string;
  }[];
}

export interface GetGlobalFeedResult {
  activities: FeedItemView[];
  pagination: {
    currentPage: number;
    totalCount: number;
    hasMore: boolean;
    limit: number;
    nextCursor?: string;
  };
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class GetGlobalFeedUseCase
  implements
    UseCase<
      GetGlobalFeedQuery,
      Result<GetGlobalFeedResult, ValidationError | AppError.UnexpectedError>
    >
{
  constructor(
    private feedRepository: IFeedRepository,
    private profileService: IProfileService,
    private cardQueryRepository: ICardQueryRepository,
    private collectionQueryRepository: ICollectionQueryRepository,
  ) {}

  async execute(
    query: GetGlobalFeedQuery,
  ): Promise<
    Result<GetGlobalFeedResult, ValidationError | AppError.UnexpectedError>
  > {
    try {
      // Set defaults and validate
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100); // Cap at 100

      let beforeActivityId: ActivityId | undefined;
      if (query.beforeActivityId) {
        const activityIdResult = ActivityId.createFromString(
          query.beforeActivityId,
        );
        if (activityIdResult.isErr()) {
          return err(
            new ValidationError(
              `Invalid beforeActivityId: ${activityIdResult.error.message}`,
            ),
          );
        }
        beforeActivityId = activityIdResult.value;
      }

      // Fetch activities from repository
      const feedResult = await this.feedRepository.getGlobalFeed({
        page,
        limit,
        beforeActivityId,
      });

      if (feedResult.isErr()) {
        return err(AppError.UnexpectedError.create(feedResult.error));
      }

      const feed = feedResult.value;

      // Get unique actor IDs for profile enrichment
      const actorIds = [
        ...new Set(feed.activities.map((activity) => activity.actorId.value)),
      ];

      // Fetch profiles for all actors
      const actorProfiles = new Map<string, ActivityActorDTO>();
      for (const actorId of actorIds) {
        const profileResult = await this.profileService.getProfile(actorId);
        if (profileResult.isOk()) {
          const profile = profileResult.value;
          actorProfiles.set(actorId, {
            id: profile.id,
            name: profile.name,
            handle: profile.handle,
            avatarUrl: profile.avatarUrl,
          });
        } else {
          // If profile fetch fails, create a fallback
          actorProfiles.set(actorId, {
            id: actorId,
            name: 'Unknown User',
            handle: actorId,
          });
        }
      }

      // Get unique card IDs for hydration
      const cardIds = [
        ...new Set(
          feed.activities
            .filter((activity) => activity.cardCollected)
            .map((activity) => activity.metadata.cardId)
        ),
      ];

      // Hydrate card data
      const cardDataMap = new Map<string, UrlCardView>();
      for (const cardId of cardIds) {
        const cardView = await this.cardQueryRepository.getUrlCardView(cardId);
        if (cardView) {
          cardDataMap.set(cardId, cardView);
        }
      }

      // Get collection data for activities that have collections
      const collectionIds = [
        ...new Set(
          feed.activities
            .filter((activity) => activity.cardCollected && activity.metadata.collectionIds)
            .flatMap((activity) => activity.metadata.collectionIds || [])
        ),
      ];

      const collectionDataMap = new Map<string, { id: string; name: string }>();
      for (const collectionId of collectionIds) {
        const collection = await this.collectionQueryRepository.findById(collectionId);
        if (collection) {
          collectionDataMap.set(collectionId, {
            id: collection.id,
            name: collection.name,
          });
        }
      }

      // Transform activities to FeedItemView
      const feedItems: FeedItemView[] = [];
      for (const activity of feed.activities) {
        if (!activity.cardCollected) {
          continue; // Skip non-card-collected activities
        }

        const actor = actorProfiles.get(activity.actorId.value);
        const cardData = cardDataMap.get(activity.metadata.cardId);

        if (!actor || !cardData) {
          continue; // Skip if we can't hydrate required data
        }

        const collections = (activity.metadata.collectionIds || [])
          .map((collectionId) => collectionDataMap.get(collectionId))
          .filter((collection): collection is { id: string; name: string } => !!collection);

        feedItems.push({
          id: activity.activityId.getStringValue(),
          user: {
            id: actor.id,
            handle: actor.handle,
            name: actor.name,
            avatarUrl: actor.avatarUrl,
          },
          card: cardData,
          collections,
        });
      }

      return ok({
        activities: feedItems,
        pagination: {
          currentPage: page,
          totalCount: feed.totalCount,
          hasMore: feed.hasMore,
          limit,
          nextCursor: feed.nextCursor?.getStringValue(),
        },
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
