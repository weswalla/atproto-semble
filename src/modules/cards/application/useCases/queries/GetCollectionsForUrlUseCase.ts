import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import {
  ICollectionQueryRepository,
  CollectionSortField,
  SortOrder,
} from '../../../domain/ICollectionQueryRepository';
import { URL } from '../../../domain/value-objects/URL';
import { IProfileService } from '../../../domain/services/IProfileService';
import { CollectionDTO, PaginationMetaDTO, CollectionSortingMetaDTO } from 'src/shared/application/dtos/base';

export interface GetCollectionsForUrlQuery {
  url: string;
  callingUserId?: string;
  page?: number;
  limit?: number;
  sortBy?: CollectionSortField;
  sortOrder?: SortOrder;
}

// Use unified base types
export interface GetCollectionsForUrlResult {
  collections: CollectionDTO[];
  pagination: PaginationMetaDTO;
  sorting: CollectionSortingMetaDTO;
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
  constructor(
    private collectionQueryRepo: ICollectionQueryRepository,
    private profileService: IProfileService,
  ) {}

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
      // Execute query to get collections containing cards with this URL (raw data with authorId)
      const result = await this.collectionQueryRepo.getCollectionsWithUrl(
        query.url,
        {
          page,
          limit,
          sortBy,
          sortOrder,
        },
      );

      // Enrich with author profiles
      const uniqueAuthorIds = Array.from(
        new Set(result.items.map((item) => item.authorId)),
      );

      const profilePromises = uniqueAuthorIds.map((authorId) =>
        this.profileService.getProfile(authorId, query.callingUserId),
      );

      const profileResults = await Promise.all(profilePromises);

      // Create a map of profiles using UserDTO
      const profileMap = new Map();

      for (let i = 0; i < uniqueAuthorIds.length; i++) {
        const profileResult = profileResults[i];
        const authorId = uniqueAuthorIds[i];
        if (!profileResult || !authorId) {
          return err(new Error('Missing profile result or author ID'));
        }
        if (profileResult.isErr()) {
          return err(
            new Error(
              `Failed to fetch author profile: ${profileResult.error instanceof Error ? profileResult.error.message : 'Unknown error'}`,
            ),
          );
        }
        const profile = profileResult.value;
        profileMap.set(authorId, {
          id: profile.id,
          name: profile.name,
          handle: profile.handle,
          avatarUrl: profile.avatarUrl,
          description: profile.bio,
        });
      }

      // Map items with enriched author data to match CollectionDTO
      const enrichedCollections: CollectionDTO[] = result.items.map(
        (item) => {
          const author = profileMap.get(item.authorId);
          if (!author) {
            throw new Error(`Profile not found for author ${item.authorId}`);
          }
          return {
            id: item.id,
            uri: item.uri,
            name: item.name,
            description: item.description,
            author,
          };
        },
      );

      return ok({
        collections: enrichedCollections,
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
