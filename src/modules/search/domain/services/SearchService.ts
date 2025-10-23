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
    options: { limit: number; threshold?: number },
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
  ): Promise<UrlView[]> {
    // For now, return basic enriched results
    // In a full implementation, you'd query the card repository for library counts
    return searchResults.map((result) => ({
      url: result.url,
      metadata: {
        url: result.url,
        title: result.metadata.title,
        description: result.metadata.description,
        author: result.metadata.author,
        thumbnailUrl: undefined, // Would be enriched from metadata service
      },
      urlLibraryCount: 0, // Would be queried from card repository
      urlInLibrary: false, // Would be determined based on calling user context
    }));
  }
}
