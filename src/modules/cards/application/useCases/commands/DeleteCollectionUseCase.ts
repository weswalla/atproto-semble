import { Result, ok, err } from "../../../../../shared/core/Result";
import { UseCase } from "../../../../../shared/core/UseCase";
import { UseCaseError } from "../../../../../shared/core/UseCaseError";
import { AppError } from "../../../../../shared/core/AppError";
import { ICollectionRepository } from "../../../domain/ICollectionRepository";
import { CollectionId } from "../../../domain/value-objects/CollectionId";
import { CuratorId } from "../../../../annotations/domain/value-objects/CuratorId";
import { ICollectionPublisher } from "../../ports/ICollectionPublisher";

export interface DeleteCollectionDTO {
  collectionId: string;
  curatorId: string;
}

export interface DeleteCollectionResponseDTO {
  collectionId: string;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class DeleteCollectionUseCase
  implements
    UseCase<
      DeleteCollectionDTO,
      Result<
        DeleteCollectionResponseDTO,
        ValidationError | AppError.UnexpectedError
      >
    >
{
  constructor(
    private collectionRepository: ICollectionRepository,
    private collectionPublisher: ICollectionPublisher
  ) {}

  async execute(
    request: DeleteCollectionDTO
  ): Promise<
    Result<
      DeleteCollectionResponseDTO,
      ValidationError | AppError.UnexpectedError
    >
  > {
    try {
      // Validate and create CuratorId
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`
          )
        );
      }
      const curatorId = curatorIdResult.value;

      // Validate and create CollectionId
      const collectionIdResult = CollectionId.createFromString(request.collectionId);
      if (collectionIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid collection ID: ${collectionIdResult.error.message}`
          )
        );
      }
      const collectionId = collectionIdResult.value;

      // Find the collection
      const collectionResult = await this.collectionRepository.findById(collectionId);
      if (collectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(collectionResult.error));
      }

      const collection = collectionResult.value;
      if (!collection) {
        return err(new ValidationError(`Collection not found: ${request.collectionId}`));
      }

      // Check if user is the author
      if (!collection.authorId.equals(curatorId)) {
        return err(
          new ValidationError("Only the collection author can delete the collection")
        );
      }

      // Unpublish collection if it was published
      if (collection.isPublished && collection.publishedRecordId) {
        const unpublishResult = await this.collectionPublisher.unpublish(
          collection.publishedRecordId
        );
        if (unpublishResult.isErr()) {
          return err(
            new ValidationError(
              `Failed to unpublish collection: ${unpublishResult.error.message}`
            )
          );
        }
      }

      // Delete collection from repository
      const deleteResult = await this.collectionRepository.delete(collectionId);
      if (deleteResult.isErr()) {
        return err(AppError.UnexpectedError.create(deleteResult.error));
      }

      return ok({
        collectionId: collection.collectionId.getStringValue(),
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
