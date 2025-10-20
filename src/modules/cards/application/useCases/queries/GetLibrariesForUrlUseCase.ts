import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import {
  ICardQueryRepository,
  CardSortField,
  SortOrder,
} from '../../../domain/ICardQueryRepository';
import { URL } from '../../../domain/value-objects/URL';
import {
  PaginationMetaDTO,
  CardSortingMetaDTO,
  UserDTO,
  UrlCardDTO,
} from 'src/shared/application/dtos/base';
import { IProfileService } from '../../../domain/services/IProfileService';

export interface GetLibrariesForUrlQuery {
  url: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

// Enriched library entry with user and card data
export interface LibraryEntryDTO {
  user: UserDTO;
  card: UrlCardDTO;
}

// Use unified pagination and sorting types
export interface GetLibrariesForUrlResult {
  libraries: LibraryEntryDTO[];
  pagination: PaginationMetaDTO;
  sorting: CardSortingMetaDTO;
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
      // Execute query to get libraries for the URL with card data
      const result = await this.cardQueryRepo.getLibrariesForUrl(query.url, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // Get unique user IDs
      const uniqueUserIds = [
        ...new Set(result.items.map((item) => item.userId)),
      ];

      // Fetch user profiles for all users
      const profilePromises = uniqueUserIds.map((userId) =>
        this.profileService.getProfile(userId),
      );

      const profileResults = await Promise.all(profilePromises);

      // Create a map of user profiles
      const profileMap = new Map<string, UserDTO>();

      for (let i = 0; i < uniqueUserIds.length; i++) {
        const profileResult = profileResults[i];
        const userId = uniqueUserIds[i];
        if (!profileResult || !userId) {
          return err(new Error('Missing profile result or user ID'));
        }
        if (profileResult.isErr()) {
          return err(
            new Error(
              `Failed to fetch user profile: ${profileResult.error instanceof Error ? profileResult.error.message : 'Unknown error'}`,
            ),
          );
        }
        const profile = profileResult.value;
        profileMap.set(userId, {
          id: profile.id,
          name: profile.name,
          handle: profile.handle,
          avatarUrl: profile.avatarUrl,
          description: profile.bio,
        });
      }

      // Enrich the library items with user profiles
      const enrichedLibraries: LibraryEntryDTO[] = result.items.map((item) => {
        const user = profileMap.get(item.userId);
        if (!user) {
          throw new Error(`Profile not found for user ${item.userId}`);
        }

        return {
          user,
          card: item.card,
        };
      });

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
