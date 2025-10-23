import { Result, ok, err } from '../../../../shared/core/Result';
import { URL } from '../../../cards/domain/value-objects/URL';
import { IMetadataService } from '../../../cards/domain/services/IMetadataService';
import { ICardQueryRepository } from '../../../cards/domain/ICardQueryRepository';
import { IVectorDatabase, FindSimilarUrlsParams } from '../IVectorDatabase';
import { UrlView } from '../../application/useCases/queries/GetSimilarUrlsForUrlUseCase';

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

      // 2. Prepare content for embedding (combine title, description, author)
      const content = this.prepareContentForEmbedding(
        metadata.title,
        metadata.description,
        metadata.author,
      );

      // 3. Index in vector database
      const indexResult = await this.vectorDatabase.indexUrl({
        url: url.value,
        title: metadata.title,
        description: metadata.description,
        author: metadata.author,
        content,
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

  private prepareContentForEmbedding(
    title?: string,
    description?: string,
    author?: string,
  ): string {
    const parts: string[] = [];

    if (title) parts.push(title);
    if (description) parts.push(description);
    if (author) parts.push(`by ${author}`);

    return parts.join(' ');
  }

  private async enrichUrlsWithContext(
    searchResults: Array<{
      url: string;
      similarity: number;
      metadata: {
        title?: string;
        description?: string;
        author?: string;
      };
    }>,
    callingUserId?: string,
  ): Promise<UrlView[]> {
    // Enrich each URL with library context
    const enrichedResults = await Promise.all(
      searchResults.map(async (result) => {
        // Get library information for this URL
        const librariesResult = await this.cardQueryRepository.getLibrariesForUrl(
          result.url,
          {
            page: 1,
            limit: 1000, // Get all libraries to count them
            sortBy: 'createdAt' as any, // Type assertion needed due to enum mismatch
            sortOrder: 'desc' as any,
          },
        );

        const urlLibraryCount = librariesResult.totalCount;
        
        // Check if calling user has this URL in their library
        let urlInLibrary = false;
        if (callingUserId) {
          urlInLibrary = librariesResult.items.some(
            (library) => library.userId === callingUserId,
          );
        }

        return {
          url: result.url,
          metadata: {
            url: result.url,
            title: result.metadata.title,
            description: result.metadata.description,
            author: result.metadata.author,
            thumbnailUrl: undefined, // Could be enriched from metadata service if needed
          },
          urlLibraryCount,
          urlInLibrary,
        };
      }),
    );

    return enrichedResults;
  }
}
