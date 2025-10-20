import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import {
  ICardQueryRepository,
  CardSortField,
  SortOrder,
} from '../../../domain/ICardQueryRepository';
import { IProfileService } from '../../../domain/services/IProfileService';
import { URL } from '../../../domain/value-objects/URL';

export interface GetLibrariesForUrlQuery {
  url: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

export interface LibraryUserDTO {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}

export interface GetLibrariesForUrlResult {
  libraries: LibraryUserDTO[];
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

export class GetLibrariesForUrlUseCase
  implements UseCase<GetLibrariesForUrlQuery, Result<GetLibrariesForUrlResult>>
{
  constructor(
    private cardQueryRepo: ICardQueryRepository,
    private profileService: IProfileService,
  ) {}

  async execute(
    query: GetLibrariesForUrlQuery,
  ): Promise<Result<GetLibrariesForUrlResult>> {
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
      // Execute query to get libraries for the URL
      const result = await this.cardQueryRepo.getLibrariesForUrl(query.url, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // Fetch profiles for all users
      const userIds = result.items.map((item) => item.userId);
      const profilePromises = userIds.map((userId) =>
        this.profileService.getProfile(userId),
      );

      const profileResults = await Promise.all(profilePromises);

      // Filter out failed profile fetches and transform to DTOs
      const enrichedLibraries: LibraryUserDTO[] = [];
      const errors: string[] = [];

      for (let i = 0; i < profileResults.length; i++) {
        const profileResult = profileResults[i];
        if (!profileResult) {
          errors.push(`No profile found for user ${userIds[i]}`);
          continue;
        }
        if (profileResult.isOk()) {
          const profile = profileResult.value;
          enrichedLibraries.push({
            id: profile.id,
            name: profile.name,
            handle: profile.handle,
            avatarUrl: profile.avatarUrl,
          });
        } else {
          errors.push(
            `Failed to fetch profile for user ${userIds[i]}: ${profileResult.error.message}`,
          );
        }
      }

      // Log errors but don't fail the entire operation
      if (errors.length > 0) {
        console.warn('Some profile fetches failed:', errors);
      }

      return ok({
        libraries: enrichedLibraries,
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
          `Failed to retrieve libraries for URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}
