import { CuratorId } from "src/modules/annotations/domain/value-objects";
import { err, ok, Result } from "src/shared/core/Result";
import { UseCase } from "src/shared/core/UseCase";
import {
  ICollectionQueryRepository,
  CollectionSortField,
  SortOrder,
} from "../../repositories/ICollectionQueryRepository";

export interface GetMyCollectionsQuery {
  curatorId: string;
  page?: number;
  limit?: number;
  sortBy?: CollectionSortField;
  sortOrder?: SortOrder;
}

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
  constructor(private collectionQueryRepo: ICollectionQueryRepository) {}

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
      // Execute query
      const result = await this.collectionQueryRepo.findByOwner(
        query.curatorId,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        }
      );

      return ok({
        collections: result.items,
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
