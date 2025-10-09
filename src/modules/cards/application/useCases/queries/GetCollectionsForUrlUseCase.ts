import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { ICollectionQueryRepository } from '../../../domain/ICollectionQueryRepository';
import { URL } from '../../../domain/value-objects/URL';

export interface GetCollectionsForUrlQuery {
  url: string;
}

export interface CollectionForUrlDTO {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  authorId: string;
}

export interface GetCollectionsForUrlResult {
  collections: CollectionForUrlDTO[];
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
  constructor(private collectionQueryRepo: ICollectionQueryRepository) {}

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

    try {
      // Execute query to get collections containing cards with this URL
      const collections =
        await this.collectionQueryRepo.getCollectionsWithUrl(query.url);

      return ok({
        collections,
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
