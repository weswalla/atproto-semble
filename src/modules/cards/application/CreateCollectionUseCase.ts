import { Result, ok, err } from "../../../shared/core/Result";
import { UseCase } from "../../../shared/core/UseCase";
import { UseCaseError } from "../../../shared/core/UseCaseError";
import { AppError } from "../../../shared/core/AppError";
import { ICollectionRepository } from "../domain/ICollectionRepository";
import { Collection, CollectionAccessType, CollectionValidationError } from "../domain/Collection";
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

      // Create collection - validation is handled by the domain
      const now = new Date();
      const collectionResult = Collection.create({
        authorId,
        name: request.name,
        description: request.description,
        accessType: request.accessType,
        collaboratorIds: [],
        cardIds: [],
        createdAt: now,
        updatedAt: now,
      });

      if (collectionResult.isErr()) {
        return err(new ValidationError(collectionResult.error.message));
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
