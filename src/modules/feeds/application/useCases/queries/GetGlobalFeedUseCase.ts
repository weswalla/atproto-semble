import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IFeedRepository } from '../../../domain/IFeedRepository';
import { ActivityId } from '../../../domain/value-objects/ActivityId';
import { IProfileService } from '../../../../cards/domain/services/IProfileService';
import {
  ICardQueryRepository,
  UrlCardView,
} from '../../../../cards/domain/ICardQueryRepository';
import { ICollectionRepository } from 'src/modules/cards/domain/ICollectionRepository';
import { CollectionId } from 'src/modules/cards/domain/value-objects/CollectionId';
import { IIdentityResolutionService } from '../../../../atproto/domain/services/IIdentityResolutionService';
import { DID } from '../../../../atproto/domain/DID';
import { DIDOrHandle } from '../../../../atproto/domain/DIDOrHandle';

export interface GetGlobalFeedQuery {
  callingUserId?: string;
  page?: number;
  limit?: number;
  beforeActivityId?: string; // For cursor-based pagination
}

export interface ActivityActorDTO {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}
// DTOs for the response
export interface FeedItemView {
  id: string;
  user: ActivityActorDTO;
  card: UrlCardView;
  createdAt: Date;
  collections: {
    id: string;
    uri?: string;
    name: string;
    description?: string;
    author: {
      id: string;
      name: string;
      handle: string;
      avatarUrl?: string;
      description?: string;
    };
    cardCount: number;
    createdAt: string;
    updatedAt: string;
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
    private collectionRepository: ICollectionRepository,
    private identityResolutionService: IIdentityResolutionService,
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
      const profileResults = await Promise.all(
        actorIds.map((actorId) => this.profileService.getProfile(actorId)),
      );

      profileResults.forEach((profileResult, idx) => {
        const actorId = actorIds[idx];
        if (!actorId) {
          return;
        }
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
      });

      // Get unique card IDs for hydration
      const cardIds = [
        ...new Set(
          feed.activities
            .filter((activity) => activity.cardCollected)
            .map((activity) => activity.metadata.cardId),
        ),
      ];

      // Hydrate card data using Promise.all
      const cardDataMap = new Map<string, UrlCardView>();
      const cardViews = await Promise.all(
        cardIds.map((cardId) =>
          this.cardQueryRepository.getUrlCardView(cardId, query.callingUserId),
        ),
      );
      cardIds.forEach((cardId, idx) => {
        const cardView = cardViews[idx];
        if (cardView) {
          cardDataMap.set(cardId, cardView);
        }
      });

      // Get collection data for activities that have collections
      const collectionIds = [
        ...new Set(
          feed.activities
            .filter(
              (activity) =>
                activity.cardCollected && activity.metadata.collectionIds,
            )
            .flatMap((activity) => activity.metadata.collectionIds || []),
        ),
      ];

      const collectionDataMap = new Map<
        string,
        {
          id: string;
          uri?: string;
          name: string;
          description?: string;
          author: {
            id: string;
            name: string;
            handle: string;
            avatarUrl?: string;
            description?: string;
          };
          cardCount: number;
          createdAt: string;
          updatedAt: string;
        }
      >();
      // Fetch all collections in parallel using Promise.all
      const collectionResults = await Promise.all(
        collectionIds.map(async (collectionId) => {
          const collectionIdResult =
            CollectionId.createFromString(collectionId);
          if (collectionIdResult.isErr()) {
            return null; // Skip invalid collection IDs
          }
          const collectionResult = await this.collectionRepository.findById(
            collectionIdResult.value,
          );
          if (collectionResult.isErr() || !collectionResult.value) {
            return null;
          }

          const collection = collectionResult.value;

          // Get author profile
          const authorProfileResult = await this.profileService.getProfile(
            collection.authorId.value,
            query.callingUserId,
          );
          if (authorProfileResult.isErr()) {
            return null;
          }

          const authorProfile = authorProfileResult.value;
          const uri = collection.publishedRecordId?.uri;

          return {
            id: collection.collectionId.getStringValue(),
            uri,
            name: collection.name.toString(),
            description: collection.description?.toString(),
            author: {
              id: authorProfile.id,
              name: authorProfile.name,
              handle: authorProfile.handle,
              avatarUrl: authorProfile.avatarUrl,
              description: authorProfile.bio,
            },
            cardCount: collection.cardCount,
            createdAt: collection.createdAt.toISOString(),
            updatedAt: collection.updatedAt.toISOString(),
            collectionId,
          };
        }),
      );

      collectionResults.forEach((result) => {
        if (result) {
          collectionDataMap.set(result.collectionId, {
            id: result.id,
            uri: result.uri,
            name: result.name,
            description: result.description,
            author: result.author,
            cardCount: result.cardCount,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          });
        }
      });

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
          .filter((collection) => !!collection);

        feedItems.push({
          id: activity.activityId.getStringValue(),
          user: actor,
          card: cardData,
          createdAt: activity.createdAt,
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
