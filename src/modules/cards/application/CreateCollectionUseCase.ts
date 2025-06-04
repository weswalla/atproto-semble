import { Result, ok, err } from "../../../shared/core/Result";
import { UseCase } from "../../../shared/core/UseCase";
import { UseCaseError } from "../../../shared/core/UseCaseError";
import { AppError } from "../../../shared/core/AppError";
import { ICollectionRepository } from "../domain/ICollectionRepository";
import { Collection, CollectionAccessType } from "../domain/Collection";
import { CuratorId } from "../../annotations/domain/value-objects/CuratorId";

export interface CreateCollectionDTO {
  authorId: string;
  name: string;
  description?: string;
  accessType: CollectionAccessType;
}

export interface CreateCollectionResponseDTO {
  collectionId: string;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class CreateCollectionUseCase
  implements
    UseCase<
      CreateCollectionDTO,
      Result<
        CreateCollectionResponseDTO,
        ValidationError | AppError.UnexpectedError
      >
    >
{
  constructor(private collectionRepository: ICollectionRepository) {}

  async execute(
    request: CreateCollectionDTO
  ): Promise<
    Result<
      CreateCollectionResponseDTO,
      ValidationError | AppError.UnexpectedError
    >
  > {
    try {
      // Validate and create CuratorId
      const authorIdResult = CuratorId.create(request.authorId);
      if (authorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid author ID: ${authorIdResult.error.message}`
          )
        );
      }
      const authorId = authorIdResult.value;

      // Validate collection name
      if (!request.name || request.name.trim().length === 0) {
        return err(new ValidationError("Collection name cannot be empty"));
      }

      if (request.name.length > 100) {
        return err(
          new ValidationError("Collection name cannot exceed 100 characters")
        );
      }

      // Validate description if provided
      if (request.description && request.description.length > 500) {
        return err(
          new ValidationError(
            "Collection description cannot exceed 500 characters"
          )
        );
      }

      // Validate access type
      if (!Object.values(CollectionAccessType).includes(request.accessType)) {
        return err(new ValidationError("Invalid access type"));
      }

      // Create collection
      const now = new Date();
      const collectionResult = Collection.create({
        authorId,
        name: request.name.trim(),
        description: request.description?.trim(),
        accessType: request.accessType,
        collaboratorIds: [],
        cardIds: [],
        createdAt: now,
        updatedAt: now,
      });

      if (collectionResult.isErr()) {
        return err(
          new ValidationError(
            `Failed to create collection: ${collectionResult.error.message}`
          )
        );
      }

      const collection = collectionResult.value;

      // Save collection
      const saveResult = await this.collectionRepository.save(collection);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      return ok({
        collectionId: collection.collectionId.getStringValue(),
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
