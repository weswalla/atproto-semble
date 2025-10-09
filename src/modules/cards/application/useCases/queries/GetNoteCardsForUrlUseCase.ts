import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import {
  ICardQueryRepository,
  CardSortField,
  SortOrder,
} from '../../../domain/ICardQueryRepository';
import { URL } from '../../../domain/value-objects/URL';

export interface GetNoteCardsForUrlQuery {
  url: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

export interface NoteCardForUrlDTO {
  id: string;
  note: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetNoteCardsForUrlResult {
  notes: NoteCardForUrlDTO[];
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
    this.name = 'ValidationError';
  }
}

export class GetNoteCardsForUrlUseCase
  implements UseCase<GetNoteCardsForUrlQuery, Result<GetNoteCardsForUrlResult>>
{
  constructor(private cardQueryRepo: ICardQueryRepository) {}

  async execute(
    query: GetNoteCardsForUrlQuery,
  ): Promise<Result<GetNoteCardsForUrlResult>> {
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
    const sortBy = query.sortBy || CardSortField.UPDATED_AT;
    const sortOrder = query.sortOrder || SortOrder.DESC;

    try {
      // Execute query to get note cards for the URL
      const result = await this.cardQueryRepo.getNoteCardsForUrl(query.url, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      return ok({
        notes: result.items,
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
          `Failed to retrieve note cards for URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}
