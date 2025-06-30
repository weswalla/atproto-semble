import { CuratorId } from "src/modules/annotations/domain/value-objects";
import { err, ok, Result } from "src/shared/core/Result";
import { UseCase } from "src/shared/core/UseCase";
import {
  ICollectionQueryRepository,
  CollectionSortField,
  SortOrder,
} from "../../../domain/ICollectionQueryRepository";
import { ICuratorEnrichmentService } from "src/modules/cards/domain/services/ICuratorEnrichmentService";

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
    avatarUrl?: string;
  };
}

// Service interface for enriching curator data
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
    private curatorEnrichmentService: ICuratorEnrichmentService
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

      // Extract unique curator IDs for enrichment
      const curatorIds = [
        ...new Set(result.items.map((item) => item.authorId)),
      ];

      // Enrich curator data
      const curatorInfoResult =
        await this.curatorEnrichmentService.enrichCurators(curatorIds);

      if (curatorInfoResult.isErr()) {
        return err(
          new Error(
            `Failed to enrich curator data: ${curatorInfoResult.error instanceof Error ? curatorInfoResult.error.message : "Unknown error"}`
          )
        );
      }

      const curatorInfoMap = curatorInfoResult.value;

      // Transform raw data to enriched DTOs
      const enrichedCollections: CollectionListItemDTO[] = result.items.map(
        (item) => {
          const curatorInfo = curatorInfoMap.get(item.authorId);
          if (!curatorInfo) {
            throw new Error(`Curator info not found for ID: ${item.authorId}`);
          }
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            updatedAt: item.updatedAt,
            createdAt: item.createdAt,
            cardCount: item.cardCount,
            createdBy: curatorInfo,
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
