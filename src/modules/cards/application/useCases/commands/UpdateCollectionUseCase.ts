import { Result, ok, err } from "../../../../../shared/core/Result";
import { UseCase } from "../../../../../shared/core/UseCase";
import { UseCaseError } from "../../../../../shared/core/UseCaseError";
import { AppError } from "../../../../../shared/core/AppError";
import { ICollectionRepository } from "../../../domain/ICollectionRepository";
import { CollectionId } from "../../../domain/value-objects/CollectionId";
import { CuratorId } from "../../../domain/value-objects/CuratorId";
import { CollectionName } from "../../../domain/value-objects/CollectionName";
import { CollectionDescription } from "../../../domain/value-objects/CollectionDescription";
import { ICollectionPublisher } from "../../ports/ICollectionPublisher";

export interface UpdateCollectionDTO {
  collectionId: string;
  name: string;
  description?: string;
  curatorId: string;
}

export interface UpdateCollectionResponseDTO {
  collectionId: string;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class UpdateCollectionUseCase
  implements
    UseCase<
      UpdateCollectionDTO,
      Result<
        UpdateCollectionResponseDTO,
        ValidationError | AppError.UnexpectedError
      >
    >
{
  constructor(
    private collectionRepository: ICollectionRepository,
    private collectionPublisher: ICollectionPublisher
  ) {}

  async execute(
    request: UpdateCollectionDTO
  ): Promise<
    Result<
      UpdateCollectionResponseDTO,
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
      const collectionIdResult = CollectionId.createFromString(
        request.collectionId
      );
      if (collectionIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid collection ID: ${collectionIdResult.error.message}`
          )
        );
      }
      const collectionId = collectionIdResult.value;

      // Find the collection
      const collectionResult =
        await this.collectionRepository.findById(collectionId);
      if (collectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(collectionResult.error));
      }

      const collection = collectionResult.value;
      if (!collection) {
        return err(
          new ValidationError(`Collection not found: ${request.collectionId}`)
        );
      }

      // Check if user is the author
      if (!collection.authorId.equals(curatorId)) {
        return err(
          new ValidationError(
            "Only the collection author can update the collection"
          )
        );
      }

      // Update collection details using domain method
      const updateResult = collection.updateDetails(
        request.name,
        request.description
      );
      if (updateResult.isErr()) {
        return err(new ValidationError(updateResult.error.message));
      }

      // Save updated collection
      const saveResult = await this.collectionRepository.save(collection);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      // Republish collection if it was already published
      if (collection.isPublished) {
        const republishResult =
          await this.collectionPublisher.publish(collection);
        if (republishResult.isErr()) {
          return err(
            new ValidationError(
              `Failed to republish collection: ${republishResult.error.message}`
            )
          );
        }

        // Update published record ID
        collection.markAsPublished(republishResult.value);

        // Save collection with updated published record ID
        const saveUpdatedResult =
          await this.collectionRepository.save(collection);
        if (saveUpdatedResult.isErr()) {
          return err(AppError.UnexpectedError.create(saveUpdatedResult.error));
        }
      }

      return ok({
        collectionId: collection.collectionId.getStringValue(),
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
