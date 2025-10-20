import { err, ok, Result } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import {
  ICardQueryRepository,
  CardSortField,
  SortOrder,
} from '../../../domain/ICardQueryRepository';
import { DIDOrHandle } from 'src/modules/atproto/domain/DIDOrHandle';
import { IIdentityResolutionService } from 'src/modules/atproto/domain/services/IIdentityResolutionService';
import {
  UrlCardDTO,
  PaginationMetaDTO,
  CardSortingMetaDTO,
} from 'src/shared/application/dtos/base';

export interface GetUrlCardsQuery {
  userId: string;
  callingUserId?: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

// Use the unified base types for the result
export interface GetUrlCardsResult {
  cards: UrlCardDTO[];
  pagination: PaginationMetaDTO;
  sorting: CardSortingMetaDTO;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GetUrlCardsUseCase
  implements UseCase<GetUrlCardsQuery, Result<GetUrlCardsResult>>
{
  constructor(
    private cardQueryRepo: ICardQueryRepository,
    private identityResolver: IIdentityResolutionService,
  ) {}

  async execute(query: GetUrlCardsQuery): Promise<Result<GetUrlCardsResult>> {
    // Set defaults
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Cap at 100
    const sortBy = query.sortBy || CardSortField.UPDATED_AT;
    const sortOrder = query.sortOrder || SortOrder.DESC;

    // Parse and validate user identifier
    const identifierResult = DIDOrHandle.create(query.userId);
    if (identifierResult.isErr()) {
      return err(new ValidationError('Invalid user identifier'));
    }

    // Resolve to DID
    const didResult = await this.identityResolver.resolveToDID(
      identifierResult.value,
    );
    if (didResult.isErr()) {
      return err(
        new ValidationError(
          `Could not resolve user identifier: ${didResult.error.message}`,
        ),
      );
    }

    try {
      // Execute query to get raw card data using the resolved DID
      const result = await this.cardQueryRepo.getUrlCardsOfUser(
        didResult.value.value,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        },
        query.callingUserId,
      );

      // Transform raw data to match UrlCardDTO structure
      const enrichedCards: UrlCardDTO[] = result.items.map((item) => ({
        ...item,
        collections: item.collections,
        // libraries field is not populated in this query (only collections)
      }));

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
          `Failed to retrieve URL cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}
