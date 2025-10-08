import { Result, ok, err } from '../../../../../shared/core/Result';
import { BaseUseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IEventPublisher } from '../../../../../shared/application/events/IEventPublisher';
import { ICardRepository } from '../../../domain/ICardRepository';
import { ICollectionQueryRepository } from '../../../domain/ICollectionQueryRepository';
import { CuratorId } from '../../../domain/value-objects/CuratorId';
import { URL } from '../../../domain/value-objects/URL';

export interface GetUrlStatusForMyLibraryQuery {
  url: string;
  curatorId: string;
}

export interface CollectionInfo {
  id: string;
  uri: string;
  name: string;
  description: string;
}

export interface GetUrlStatusForMyLibraryResult {
  cardId?: string;
  collections?: CollectionInfo[];
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class GetUrlStatusForMyLibraryUseCase extends BaseUseCase<
  GetUrlStatusForMyLibraryQuery,
  Result<GetUrlStatusForMyLibraryResult, ValidationError | AppError.UnexpectedError>
> {
  constructor(
    private cardRepository: ICardRepository,
    private collectionQueryRepository: ICollectionQueryRepository,
    eventPublisher: IEventPublisher,
  ) {
    super(eventPublisher);
  }

  async execute(
    query: GetUrlStatusForMyLibraryQuery,
  ): Promise<
    Result<
      GetUrlStatusForMyLibraryResult,
      ValidationError | AppError.UnexpectedError
    >
  > {
    try {
      // Validate and create CuratorId
      const curatorIdResult = CuratorId.create(query.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`,
          ),
        );
      }
      const curatorId = curatorIdResult.value;

      // Validate URL
      const urlResult = URL.create(query.url);
      if (urlResult.isErr()) {
        return err(
          new ValidationError(`Invalid URL: ${urlResult.error.message}`),
        );
      }
      const url = urlResult.value;

      // Check if user has a URL card with this URL
      const existingCardResult = await this.cardRepository.findUsersUrlCardByUrl(
        url,
        curatorId,
      );
      if (existingCardResult.isErr()) {
        return err(AppError.UnexpectedError.create(existingCardResult.error));
      }

      const card = existingCardResult.value;
      const result: GetUrlStatusForMyLibraryResult = {};

      if (card) {
        result.cardId = card.cardId.getStringValue();

        // TODO: Need to extend ICollectionQueryRepository with method to get collections containing a specific card for a user
        // For now, we'll note this limitation
        // const collectionsResult = await this.collectionQueryRepository.getCollectionsContainingCardForUser(
        //   card.cardId,
        //   curatorId,
        // );
        // if (collectionsResult.isErr()) {
        //   return err(AppError.UnexpectedError.create(collectionsResult.error));
        // }
        // result.collections = collectionsResult.value.map(collection => ({
        //   id: collection.id,
        //   uri: collection.uri,
        //   name: collection.name,
        //   description: collection.description,
        // }));

        // Placeholder for collections - will need repository extension
        result.collections = [];
      }

      return ok(result);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
