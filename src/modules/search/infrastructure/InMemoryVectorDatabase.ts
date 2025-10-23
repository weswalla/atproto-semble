import { Result, ok, err } from '../../../shared/core/Result';
import {
  IVectorDatabase,
  IndexUrlParams,
  FindSimilarUrlsParams,
  UrlSearchResult,
} from '../domain/IVectorDatabase';

interface IndexedUrl {
  url: string;
  content: string;
  metadata: {
    title?: string;
    description?: string;
    author?: string;
  };
  indexedAt: Date;
}

export class InMemoryVectorDatabase implements IVectorDatabase {
  private urls: Map<string, IndexedUrl> = new Map();

  async indexUrl(params: IndexUrlParams): Promise<Result<void>> {
    try {
      console.log('Indexing URL in InMemoryVectorDatabase:', params.url);
      this.urls.set(params.url, {
        url: params.url,
        content: params.content,
        metadata: {
          title: params.title,
          description: params.description,
          author: params.author,
        },
        indexedAt: new Date(),
      });
      console.log('Current indexed URLs:', Array.from(this.urls.keys()));

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(
          `Failed to index URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async findSimilarUrls(
    params: FindSimilarUrlsParams,
  ): Promise<Result<UrlSearchResult[]>> {
    try {
      console.log('all urls to compare', this.urls);
      const threshold = params.threshold || 0.3;
      const results: UrlSearchResult[] = [];

      // Get the query URL's content for comparison
      const queryUrl = this.urls.get(params.url);
      const queryContent = queryUrl?.content || params.url;

      for (const [url, indexed] of this.urls.entries()) {
        // Skip the query URL itself
        if (url === params.url) continue;

        const similarity = this.calculateSimilarity(
          queryContent,
          indexed.content,
        );

        if (similarity >= threshold) {
          results.push({
            url: indexed.url,
            similarity,
            metadata: indexed.metadata,
          });
        }
      }

      // Sort by similarity (highest first) and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const limitedResults = results.slice(0, params.limit);

      return ok(limitedResults);
    } catch (error) {
      return err(
        new Error(
          `Failed to find similar URLs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async deleteUrl(url: string): Promise<Result<void>> {
    try {
      this.urls.delete(url);
      return ok(undefined);
    } catch (error) {
      return err(
        new Error(
          `Failed to delete URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }

  async healthCheck(): Promise<Result<boolean>> {
    return ok(true);
  }

  /**
   * Simple text similarity calculation using Jaccard similarity
   * In a real implementation, this would use proper vector embeddings
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter((word) => set2.has(word)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2); // Filter out very short words
  }

  /**
   * Clear all indexed URLs (useful for testing)
   */
  clear(): void {
    this.urls.clear();
  }

  /**
   * Get count of indexed URLs (useful for testing/monitoring)
   */
  getIndexedUrlCount(): number {
    return this.urls.size;
  }
}
