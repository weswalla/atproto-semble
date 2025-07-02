import { CuratorId } from "src/modules/annotations/domain/value-objects";
import { err, ok, Result } from "src/shared/core/Result";
import { UseCase } from "src/shared/core/UseCase";
import {
  ICardQueryRepository,
  CardSortField,
  SortOrder,
} from "../../../domain/ICardQueryRepository";

export interface GetMyUrlCardsQuery {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

// Enriched data for the final use case result
export interface UrlCardListItemDTO {
  id: string;
  url: string;
  urlMeta: {
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  collections: {
    id: string;
    name: string;
    authorId: string;
  }[];
  note?: {
    id: string;
    text: string;
  };
}

export interface GetMyUrlCardsResult {
  cards: UrlCardListItemDTO[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
    limit: number;
  };
  sorting: {
    sortBy: CardSortField;
    sortOrder: SortOrder;
  };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class GetMyUrlCardsUseCase
  implements UseCase<GetMyUrlCardsQuery, Result<GetMyUrlCardsResult>>
{
  constructor(private cardQueryRepo: ICardQueryRepository) {}

  async execute(
    query: GetMyUrlCardsQuery
  ): Promise<Result<GetMyUrlCardsResult>> {
    // Set defaults
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Cap at 100
    const sortBy = query.sortBy || CardSortField.UPDATED_AT;
    const sortOrder = query.sortOrder || SortOrder.DESC;

    // Validate user ID
    const userIdResult = CuratorId.create(query.userId);
    if (userIdResult.isErr()) {
      return err(new ValidationError("Invalid user ID"));
    }

    try {
      // Execute query to get raw card data
      const result = await this.cardQueryRepo.getUrlCardsOfUser(
        query.userId,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        }
      );

      // Transform raw data to enriched DTOs
      const enrichedCards: UrlCardListItemDTO[] = result.items.map(
        (item) => {
          return {
            id: item.id,
            url: item.url,
            urlMeta: item.urlMeta,
            libraryCount: item.libraryCount,
            collections: item.collections,
            note: item.note,
          };
        }
      );

      return ok({
        cards: enrichedCards,
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
          `Failed to retrieve URL cards: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  }
}
