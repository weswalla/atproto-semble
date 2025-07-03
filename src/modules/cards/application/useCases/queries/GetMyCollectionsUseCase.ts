import { err, ok, Result } from "src/shared/core/Result";
import { UseCase } from "src/shared/core/UseCase";
import {
  ICollectionQueryRepository,
  CollectionSortField,
  SortOrder,
} from "../../../domain/ICollectionQueryRepository";
import { IProfileService } from "src/modules/cards/domain/services/IProfileService";
import { CuratorId } from "src/modules/cards/domain/value-objects/CuratorId";

export interface GetMyCollectionsQuery {
  curatorId: string;
  page?: number;
  limit?: number;
  sortBy?: CollectionSortField;
  sortOrder?: SortOrder;
}

// Enriched data for the final use case result
export interface CollectionListItemDTO {
  id: string;
  name: string;
  description?: string;
  updatedAt: Date;
  createdAt: Date;
  cardCount: number;
  createdBy: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
}
export interface GetMyCollectionsResult {
  collections: CollectionListItemDTO[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
    limit: number;
  };
  sorting: {
    sortBy: CollectionSortField;
    sortOrder: SortOrder;
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class GetMyCollectionsUseCase
  implements UseCase<GetMyCollectionsQuery, Result<GetMyCollectionsResult>>
{
  constructor(
    private collectionQueryRepo: ICollectionQueryRepository,
    private profileService: IProfileService
  ) {}

  async execute(
    query: GetMyCollectionsQuery
  ): Promise<Result<GetMyCollectionsResult>> {
    // Set defaults
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Cap at 100
    const sortBy = query.sortBy || CollectionSortField.UPDATED_AT;
    const sortOrder = query.sortOrder || SortOrder.DESC;

    // Validate curator ID
    const curatorIdResult = CuratorId.create(query.curatorId);
    if (curatorIdResult.isErr()) {
      return err(new ValidationError("Invalid curator ID"));
    }

    try {
      // Execute query to get raw collection data
      const result = await this.collectionQueryRepo.findByCreator(
        query.curatorId,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        }
      );

      // Get user profile for the curator
      const profileResult = await this.profileService.getProfile(
        query.curatorId
      );

      if (profileResult.isErr()) {
        return err(
          new Error(
            `Failed to fetch user profile: ${profileResult.error instanceof Error ? profileResult.error.message : "Unknown error"}`
          )
        );
      }
      const profile = profileResult.value;

      // Transform raw data to enriched DTOs
      const enrichedCollections: CollectionListItemDTO[] = result.items.map(
        (item) => {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            updatedAt: item.updatedAt,
            createdAt: item.createdAt,
            cardCount: item.cardCount,
            createdBy: {
              id: profile.id,
              name: profile.name,
              handle: profile.handle,
              avatarUrl: profile.avatarUrl,
            },
          };
        }
      );

      return ok({
        collections: enrichedCollections,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.totalCount / limit),
          totalCount: result.totalCount,
          hasMore: page * limit < result.totalCount,
          limit,
        },
        sorting: {
          sortBy,
          sortOrder,
        },
      });
    } catch (error) {
      return err(
        new Error(
          `Failed to retrieve collections: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  }
}
