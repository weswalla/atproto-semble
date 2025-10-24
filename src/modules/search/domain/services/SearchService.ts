import { Result, ok, err } from '../../../../shared/core/Result';
import { URL } from '../../../cards/domain/value-objects/URL';
import { IMetadataService } from '../../../cards/domain/services/IMetadataService';
import { ICardQueryRepository } from '../../../cards/domain/ICardQueryRepository';
import { IVectorDatabase, FindSimilarUrlsParams } from '../IVectorDatabase';
import { UrlView } from '@semble/types/api/responses';
import { CardSortField, SortOrder } from '@semble/types/api/common';
import { UrlMetadataProps } from 'src/modules/cards/domain/value-objects/UrlMetadata';

export class SearchService {
  constructor(
    private vectorDatabase: IVectorDatabase,
    private metadataService: IMetadataService,
    private cardQueryRepository: ICardQueryRepository,
  ) {}

  async indexUrl(url: URL): Promise<Result<void>> {
    try {
      // 1. Get metadata for the URL
      const metadataResult = await this.metadataService.fetchMetadata(url);
      if (metadataResult.isErr()) {
        return err(
          new Error(
            `Failed to fetch metadata: ${metadataResult.error.message}`,
          ),
        );
      }

      const metadata = metadataResult.value;

      // 2. Index in vector database
      const indexResult = await this.vectorDatabase.indexUrl({
        url: metadata.url,
        title: metadata.title,
        description: metadata.description,
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        siteName: metadata.siteName,
        imageUrl: metadata.imageUrl,
        type: metadata.type,
        content: [metadata.title, metadata.description]
          .filter(Boolean)
          .join(' '),
      });

      if (indexResult.isErr()) {
        return err(
          new Error(`Failed to index URL: ${indexResult.error.message}`),
        );
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(
          `Search service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async findSimilarUrls(
    url: URL,
    options: { limit: number; threshold?: number; callingUserId?: string },
  ): Promise<Result<UrlView[]>> {
    try {
      // 1. Find similar URLs from vector database
      const findParams: FindSimilarUrlsParams = {
        url: url.value,
        limit: options.limit,
        threshold: options.threshold,
      };

      const similarResult =
        await this.vectorDatabase.findSimilarUrls(findParams);
      if (similarResult.isErr()) {
        return err(
          new Error(`Vector search failed: ${similarResult.error.message}`),
        );
      }

      // 2. Enrich results with library counts and context
      const enrichedUrls = await this.enrichUrlsWithContext(
        similarResult.value,
        options.callingUserId,
      );

      return ok(enrichedUrls);
    } catch (error) {
      return err(
        new Error(
          `Search service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async healthCheck(): Promise<Result<boolean>> {
    return await this.vectorDatabase.healthCheck();
  }

  private async enrichUrlsWithContext(
    searchResults: Array<{
      url: string;
      similarity: number;
      metadata: UrlMetadataProps;
    }>,
    callingUserId?: string,
  ): Promise<UrlView[]> {
    // Enrich each URL with library context
    const enrichedResults = await Promise.all(
      searchResults.map(async (result) => {
        // Get library information for this URL
        const librariesResult =
          await this.cardQueryRepository.getLibrariesForUrl(result.url, {
            page: 1,
            limit: 1000, // Get all libraries to count them
            sortBy: CardSortField.CREATED_AT,
            sortOrder: SortOrder.DESC,
          });

        const urlLibraryCount = librariesResult.totalCount;

        // Check if calling user has this URL in their library
        // Default to false if no calling user (unauthenticated request)
        const urlInLibrary = callingUserId
          ? librariesResult.items.some(
              (library) => library.userId === callingUserId,
            )
          : false;

        return {
          url: result.url,
          metadata: {
            url: result.url,
            title: result.metadata.title,
            description: result.metadata.description,
            author: result.metadata.author,
            siteName: result.metadata.siteName,
            imageUrl: result.metadata.imageUrl,
            type: result.metadata.type,
            thumbnailUrl: result.metadata.imageUrl, // Use imageUrl as thumbnailUrl
          },
          urlLibraryCount,
          urlInLibrary,
        };
      }),
    );

    return enrichedResults;
  }
}
