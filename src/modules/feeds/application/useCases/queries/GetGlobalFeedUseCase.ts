import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IFeedRepository } from '../../../domain/IFeedRepository';
import { ActivityId } from '../../../domain/value-objects/ActivityId';
import { IProfileService } from '../../../../cards/domain/services/IProfileService';
import { ICardQueryRepository } from '../../../../cards/domain/ICardQueryRepository';
import { ICollectionRepository } from 'src/modules/cards/domain/ICollectionRepository';
import { CollectionId } from 'src/modules/cards/domain/value-objects/CollectionId';
import { IIdentityResolutionService } from '../../../../atproto/domain/services/IIdentityResolutionService';
import { DID } from '../../../../atproto/domain/DID';
import { DIDOrHandle } from '../../../../atproto/domain/DIDOrHandle';
import {
  UserDTO,
  UrlCardDTO,
  CollectionDTO,
  PaginationMetaDTO,
} from 'src/shared/application/dtos/base';

export interface GetGlobalFeedQuery {
  callingUserId?: string;
  page?: number;
  limit?: number;
  beforeActivityId?: string; // For cursor-based pagination
}

// Use unified base types for feed items
export interface FeedItemView {
  id: string;
  user: UserDTO;
  card: UrlCardDTO;
  createdAt: Date;
  collections: CollectionDTO[];
}

export interface GetGlobalFeedResult {
  activities: FeedItemView[];
  pagination: PaginationMetaDTO;
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
      const actorProfiles = new Map<string, UserDTO>();
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
            description: profile.bio,
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
      const cardDataMap = new Map<string, UrlCardDTO>();
      const cardViews = await Promise.all(
        cardIds.map((cardId) =>
          this.cardQueryRepository.getUrlCardView(cardId, query.callingUserId),
        ),
      );

      // Fetch profiles for all library users in all cards
      const allLibraryUserIds = new Set<string>();
      cardViews.forEach((cardView) => {
        if (cardView) {
          cardView.libraries.forEach((lib) => allLibraryUserIds.add(lib.userId));
        }
      });

      const libraryUserProfiles = new Map<string, UserDTO>();
      const libraryProfileResults = await Promise.all(
        Array.from(allLibraryUserIds).map((userId) =>
          this.profileService.getProfile(userId),
        ),
      );

      Array.from(allLibraryUserIds).forEach((userId, idx) => {
        const profileResult = libraryProfileResults[idx];
        if (profileResult && profileResult.isOk()) {
          const profile = profileResult.value;
          libraryUserProfiles.set(userId, {
            id: profile.id,
            name: profile.name,
            handle: profile.handle,
            avatarUrl: profile.avatarUrl,
            description: profile.bio,
          });
        }
      });

      // Convert UrlCardViewDTO to UrlCardDTO by enriching libraries
      cardIds.forEach((cardId, idx) => {
        const cardView = cardViews[idx];
        if (cardView) {
          const enrichedLibraries = cardView.libraries
            .map((lib) => libraryUserProfiles.get(lib.userId))
            .filter((user): user is UserDTO => !!user);

          const cardDTO: UrlCardDTO = {
            ...cardView,
            libraries: enrichedLibraries,
          };
          cardDataMap.set(cardId, cardDTO);
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
        { id: string; name: string; authorHandle: string; uri?: string }
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

          const didOrHandleResult = DIDOrHandle.create(
            collection.authorId.value,
          );
          if (didOrHandleResult.isErr()) {
            return null;
          }

          const resolvedHandleResult =
            await this.identityResolutionService.resolveToHandle(
              didOrHandleResult.value,
            );
          if (resolvedHandleResult.isErr()) {
            return null;
          }

          const handle = resolvedHandleResult.value;
          const uri = collection.publishedRecordId?.uri;

          return {
            id: collection.collectionId.getStringValue(),
            name: collection.name.toString(),
            authorHandle: handle.value,
            uri,
            collectionId,
          };
        }),
      );

      collectionResults.forEach((result) => {
        if (result) {
          collectionDataMap.set(result.collectionId, {
            id: result.id,
            name: result.name,
            authorHandle: result.authorHandle,
            uri: result.uri,
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
          totalPages: Math.ceil(feed.totalCount / limit),
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
