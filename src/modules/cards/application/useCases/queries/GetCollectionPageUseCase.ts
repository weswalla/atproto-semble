import { CollectionId } from "src/modules/cards/domain/value-objects/CollectionId";
import { err, ok, Result } from "src/shared/core/Result";
import { UseCase } from "src/shared/core/UseCase";
import {
  ICardQueryRepository,
  CardSortField,
  SortOrder,
} from "../../../domain/ICardQueryRepository";
import { ICollectionRepository } from "../../../domain/ICollectionRepository";
import { IProfileService } from "../../../domain/services/IProfileService";

export interface GetCollectionPageQuery {
  collectionId: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

// Enriched data for the final use case result
export interface CollectionPageUrlCardDTO {
  id: string;
  url: string;
  urlMeta: {
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  note?: {
    id: string;
    text: string;
  };
}

export interface GetCollectionPageResult {
  id: string;
  name: string;
  description?: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
  urlCards: CollectionPageUrlCardDTO[];
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

export class CollectionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CollectionNotFoundError";
  }
}

export class GetCollectionPageUseCase
  implements UseCase<GetCollectionPageQuery, Result<GetCollectionPageResult>>
{
  constructor(
    private collectionRepo: ICollectionRepository,
    private cardQueryRepo: ICardQueryRepository,
    private profileService: IProfileService
  ) {}

  async execute(
    query: GetCollectionPageQuery
  ): Promise<Result<GetCollectionPageResult>> {
    // Set defaults
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Cap at 100
    const sortBy = query.sortBy || CardSortField.UPDATED_AT;
    const sortOrder = query.sortOrder || SortOrder.DESC;

    // Validate collection ID
    const collectionIdResult = CollectionId.create(query.collectionId);
    if (collectionIdResult.isErr()) {
      return err(new ValidationError("Invalid collection ID"));
    }

    try {
      // Get the collection
      const collectionResult = await this.collectionRepo.findById(
        collectionIdResult.value
      );

      if (collectionResult.isErr()) {
        return err(
          new Error(
            `Failed to fetch collection: ${collectionResult.error instanceof Error ? collectionResult.error.message : "Unknown error"}`
          )
        );
      }

      const collection = collectionResult.value;
      if (!collection) {
        return err(new CollectionNotFoundError("Collection not found"));
      }

      // Get author profile
      const profileResult = await this.profileService.getProfile(
        collection.authorId.value
      );

      if (profileResult.isErr()) {
        return err(
          new Error(
            `Failed to fetch author profile: ${profileResult.error instanceof Error ? profileResult.error.message : "Unknown error"}`
          )
        );
      }

      const authorProfile = profileResult.value;

      // Get cards in the collection
      const cardsResult = await this.cardQueryRepo.getCardsInCollection(
        query.collectionId,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        }
      );

      // Transform raw card data to enriched DTOs
      const enrichedCards: CollectionPageUrlCardDTO[] = cardsResult.items.map(
        (item) => {
          return {
            id: item.id,
            url: item.url,
            urlMeta: item.urlMeta,
            libraryCount: item.libraryCount,
            note: item.note,
          };
        }
      );

      return ok({
        id: collection.collectionId.getStringValue(),
        name: collection.name.value,
        description: collection.description?.value,
        author: {
          id: authorProfile.id,
          name: authorProfile.name,
          handle: authorProfile.handle,
          avatarUrl: authorProfile.avatarUrl,
        },
        urlCards: enrichedCards,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(cardsResult.totalCount / limit),
          totalCount: cardsResult.totalCount,
          hasMore: page * limit < cardsResult.totalCount,
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
          `Failed to retrieve collection page: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  }
}
