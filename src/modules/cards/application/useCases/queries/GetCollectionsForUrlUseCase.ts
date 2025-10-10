import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import {
  ICollectionQueryRepository,
  CollectionSortField,
  SortOrder,
} from '../../../domain/ICollectionQueryRepository';
import { URL } from '../../../domain/value-objects/URL';

export interface GetCollectionsForUrlQuery {
  url: string;
  page?: number;
  limit?: number;
  sortBy?: CollectionSortField;
  sortOrder?: SortOrder;
}

export interface CollectionForUrlDTO {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  authorId: string;
}

export interface GetCollectionsForUrlResult {
  collections: CollectionForUrlDTO[];
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
    this.name = 'ValidationError';
  }
}

export class GetCollectionsForUrlUseCase
  implements
    UseCase<GetCollectionsForUrlQuery, Result<GetCollectionsForUrlResult>>
{
  constructor(private collectionQueryRepo: ICollectionQueryRepository) {}

  async execute(
    query: GetCollectionsForUrlQuery,
  ): Promise<Result<GetCollectionsForUrlResult>> {
    // Validate URL
    const urlResult = URL.create(query.url);
    if (urlResult.isErr()) {
      return err(
        new ValidationError(`Invalid URL: ${urlResult.error.message}`),
      );
    }

    // Set defaults
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Cap at 100
    const sortBy = query.sortBy || CollectionSortField.NAME;
    const sortOrder = query.sortOrder || SortOrder.ASC;

    try {
      // Execute query to get collections containing cards with this URL
      const result = await this.collectionQueryRepo.getCollectionsWithUrl(
        query.url,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        },
      );

      return ok({
        collections: result.items,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.totalCount / limit),
          totalCount: result.totalCount,
          hasMore: result.hasMore,
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
          `Failed to retrieve collections for URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}
