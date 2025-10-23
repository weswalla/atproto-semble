import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { URL } from '../../../../cards/domain/value-objects/URL';
import { SearchService } from '../../../domain/services/SearchService';

export interface GetSimilarUrlsForUrlQuery {
  url: string;
  page?: number;
  limit?: number;
  threshold?: number;
}

export interface UrlView {
  url: string;
  metadata: {
    url: string;
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  urlLibraryCount: number;
  urlInLibrary?: boolean;
}

export interface GetSimilarUrlsForUrlResult {
  urls: UrlView[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
    limit: number;
  };
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class GetSimilarUrlsForUrlUseCase
  implements
    UseCase<
      GetSimilarUrlsForUrlQuery,
      Result<GetSimilarUrlsForUrlResult, ValidationError | AppError.UnexpectedError>
    >
{
  constructor(private searchService: SearchService) {}

  async execute(
    query: GetSimilarUrlsForUrlQuery,
  ): Promise<
    Result<
      GetSimilarUrlsForUrlResult,
      ValidationError | AppError.UnexpectedError
    >
  > {
    try {
      // Set defaults
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100); // Cap at 100
      const threshold = query.threshold || 0.7;

      // Validate URL
      const urlResult = URL.create(query.url);
      if (urlResult.isErr()) {
        return err(
          new ValidationError(`Invalid URL: ${urlResult.error.message}`),
        );
      }

      // Find similar URLs
      const similarUrlsResult = await this.searchService.findSimilarUrls(
        urlResult.value,
        {
          limit: limit * page, // Get more results to handle pagination
          threshold,
        },
      );

      if (similarUrlsResult.isErr()) {
        return err(
          new ValidationError(
            `Failed to find similar URLs: ${similarUrlsResult.error.message}`,
          ),
        );
      }

      const allUrls = similarUrlsResult.value;
      const totalCount = allUrls.length;

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUrls = allUrls.slice(startIndex, endIndex);

      return ok({
        urls: paginatedUrls,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasMore: endIndex < totalCount,
          limit,
        },
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
