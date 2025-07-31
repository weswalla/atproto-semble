import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IFeedRepository } from '../../../domain/IFeedRepository';
import { ActivityId } from '../../../domain/value-objects/ActivityId';
import { ActivityTypeEnum } from '../../../domain/value-objects/ActivityType';
import { IProfileService } from '../../../../cards/domain/services/IProfileService';

export interface GetGlobalFeedQuery {
  page?: number;
  limit?: number;
  beforeActivityId?: string; // For cursor-based pagination
}

// DTOs for the response
export interface ActivityActorDTO {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}

export interface CardAddedToLibraryActivityDTO {
  id: string;
  type: ActivityTypeEnum.CARD_ADDED_TO_LIBRARY;
  actor: ActivityActorDTO;
  cardId: string;
  cardTitle?: string;
  cardUrl?: string;
  createdAt: Date;
}

export interface CardAddedToCollectionActivityDTO {
  id: string;
  type: ActivityTypeEnum.CARD_ADDED_TO_COLLECTION;
  actor: ActivityActorDTO;
  cardId: string;
  cardTitle?: string;
  cardUrl?: string;
  collectionIds: string[];
  collectionNames: string[];
  createdAt: Date;
}

export type ActivityDTO =
  | CardAddedToLibraryActivityDTO
  | CardAddedToCollectionActivityDTO;

export interface GetGlobalFeedResult {
  activities: ActivityDTO[];
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

      // Transform activities to DTOs
      const activityDTOs: ActivityDTO[] = feed.activities.map((activity) => {
        const actor = actorProfiles.get(activity.actorId.value)!;

        if (activity.isCardAddedToLibrary) {
          const metadata = activity.cardAddedToLibraryMetadata!;
          return {
            id: activity.activityId.getStringValue(),
            type: ActivityTypeEnum.CARD_ADDED_TO_LIBRARY,
            actor,
            cardId: metadata.cardId,
            cardTitle: metadata.cardTitle,
            cardUrl: metadata.cardUrl,
            createdAt: activity.createdAt,
          } as CardAddedToLibraryActivityDTO;
        } else if (activity.isCardAddedToCollection) {
          const metadata = activity.cardAddedToCollectionMetadata!;
          return {
            id: activity.activityId.getStringValue(),
            type: ActivityTypeEnum.CARD_ADDED_TO_COLLECTION,
            actor,
            cardId: metadata.cardId,
            cardTitle: metadata.cardTitle,
            cardUrl: metadata.cardUrl,
            collectionIds: metadata.collectionIds,
            collectionNames: metadata.collectionNames,
            createdAt: activity.createdAt,
          } as CardAddedToCollectionActivityDTO;
        } else {
          throw new Error(`Unsupported activity type: ${activity.type.value}`);
        }
      });

      return ok({
        activities: activityDTOs,
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
