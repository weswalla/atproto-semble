import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import {
  ICardQueryRepository,
  CardSortField,
  SortOrder,
} from '../../../domain/ICardQueryRepository';
import { URL } from '../../../domain/value-objects/URL';
import { IProfileService } from '../../../domain/services/IProfileService';

export interface GetLibrariesForUrlQuery {
  url: string;
  callingUserId?: string;
  page?: number;
  limit?: number;
  sortBy?: CardSortField;
  sortOrder?: SortOrder;
}

export interface UserDTO {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  description?: string;
}

export interface UrlCardDTO {
  id: string;
  type: 'URL';
  url: string;
  cardContent: {
    url: string;
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  urlLibraryCount: number;
  urlInLibrary?: boolean;
  createdAt: string;
  updatedAt: string;
  author: UserDTO;
  note?: {
    id: string;
    text: string;
  };
}

export interface LibraryForUrlDTO {
  user: UserDTO;
  card: UrlCardDTO;
}

export interface GetLibrariesForUrlResult {
  libraries: LibraryForUrlDTO[];
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
      // Execute query to get libraries with full card data
      const result = await this.cardQueryRepo.getLibrariesForUrl(query.url, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // Enrich with user profiles
      const uniqueUserIds = Array.from(
        new Set(result.items.map((item) => item.userId)),
      );

      const profilePromises = uniqueUserIds.map((userId) =>
        this.profileService.getProfile(userId, query.callingUserId),
      );

      const profileResults = await Promise.all(profilePromises);

      // Create a map of profiles
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

      // Map items with enriched user data and card data
      const enrichedLibraries: LibraryForUrlDTO[] = result.items.map((item) => {
        const user = profileMap.get(item.userId);
        if (!user) {
          throw new Error(`Profile not found for user ${item.userId}`);
        }

        // Build card object
        // Note: userId is the card author (it's their card in their library)
        const card: UrlCardDTO = {
          id: item.card.id,
          type: 'URL',
          url: item.card.url,
          cardContent: item.card.cardContent,
          libraryCount: item.card.libraryCount,
          urlLibraryCount: item.card.urlLibraryCount,
          urlInLibrary: item.card.urlInLibrary,
          createdAt: item.card.createdAt.toISOString(),
          updatedAt: item.card.updatedAt.toISOString(),
          author: user, // Card author is same as library user
          note: item.card.note,
        };

        return {
          user,
          card,
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
