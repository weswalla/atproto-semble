import { Result, ok, err } from "../../../../../shared/core/Result";
import { UseCase } from "../../../../../shared/core/UseCase";
import { UseCaseError } from "../../../../../shared/core/UseCaseError";
import { AppError } from "../../../../../shared/core/AppError";
import { ICardRepository } from "../../../domain/ICardRepository";
import { ICollectionRepository } from "../../../domain/ICollectionRepository";
import {
  CardFactory,
  IUrlCardInput,
  INoteCardInput,
} from "../../../domain/CardFactory";
import { CollectionId } from "../../../domain/value-objects/CollectionId";
import { CuratorId } from "../../../../annotations/domain/value-objects/CuratorId";
import { IMetadataService } from "../../../domain/services/IMetadataService";
import { CardTypeEnum } from "../../../domain/value-objects/CardType";
import { URL } from "../../../domain/value-objects/URL";
import { ICardPublisher } from "../../ports/ICardPublisher";
import { ICollectionPublisher } from "../../ports/ICollectionPublisher";
import { Cards } from "../../../domain/Cards";

export interface AddUrlToLibraryDTO {
  url: string;
  note?: string;
  collectionIds?: string[];
  curatorId: string;
}

export interface AddUrlToLibraryResponseDTO {
  urlCardId: string;
  noteCardId?: string;
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class AddUrlToLibraryUseCase
  implements
    UseCase<
      AddUrlToLibraryDTO,
      Result<
        AddUrlToLibraryResponseDTO,
        ValidationError | AppError.UnexpectedError
      >
    >
{
  constructor(
    private cardRepository: ICardRepository,
    private collectionRepository: ICollectionRepository,
    private metadataService: IMetadataService,
    private cardPublisher: ICardPublisher,
    private collectionPublisher: ICollectionPublisher
  ) {}

  async execute(
    request: AddUrlToLibraryDTO
  ): Promise<
    Result<
      AddUrlToLibraryResponseDTO,
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

      // Validate URL
      const urlResult = URL.create(request.url);
      if (urlResult.isErr()) {
        return err(
          new ValidationError(`Invalid URL: ${urlResult.error.message}`)
        );
      }
      const url = urlResult.value;

      // Check if URL card already exists
      const existingUrlCardResult =
        await this.cardRepository.findUrlCardByUrl(url);
      if (existingUrlCardResult.isErr()) {
        return err(
          AppError.UnexpectedError.create(existingUrlCardResult.error)
        );
      }

      let urlCard = existingUrlCardResult.value;
      if (!urlCard) {
        // Fetch metadata for URL
        const metadataResult = await this.metadataService.fetchMetadata(url);
        if (metadataResult.isErr()) {
          return err(
            new ValidationError(
              `Failed to fetch metadata: ${metadataResult.error.message}`
            )
          );
        }

        // Create URL card
        const urlCardInput: IUrlCardInput = {
          type: CardTypeEnum.URL,
          url: request.url,
          metadata: metadataResult.value,
        };

        const urlCardResult = CardFactory.create({
          curatorId: request.curatorId,
          cardInput: urlCardInput,
        });

        if (urlCardResult.isErr()) {
          return err(new ValidationError(urlCardResult.error.message));
        }

        urlCard = urlCardResult.value;

        // Save URL card
        const saveUrlCardResult = await this.cardRepository.save(urlCard);
        if (saveUrlCardResult.isErr()) {
          return err(AppError.UnexpectedError.create(saveUrlCardResult.error));
        }
      }

      // Check if URL card is already in curator's library
      const isInLibrary = urlCard.isInLibrary(curatorId);

      if (!isInLibrary) {
        // Publish URL card to library
        const publishUrlCardResult =
          await this.cardPublisher.publishCardToLibrary(urlCard, curatorId);
        if (publishUrlCardResult.isErr()) {
          return err(
            new ValidationError(
              `Failed to publish URL card: ${publishUrlCardResult.error.message}`
            )
          );
        }

        // Mark URL card as published
        urlCard.addToLibrary(curatorId);
        urlCard.markCardInLibraryAsPublished(
          curatorId,
          publishUrlCardResult.value
        );

        // Update URL card in repository
        const updateUrlCardResult = await this.cardRepository.save(urlCard);
        if (updateUrlCardResult.isErr()) {
          return err(
            AppError.UnexpectedError.create(updateUrlCardResult.error)
          );
        }

      }

      let noteCard;

      // Create note card if note is provided
      if (request.note) {
        const noteCardInput: INoteCardInput = {
          type: CardTypeEnum.NOTE,
          text: request.note,
          parentCardId: urlCard.cardId.getStringValue(),
          url: request.url,
        };

        const noteCardResult = CardFactory.create({
          curatorId: request.curatorId,
          cardInput: noteCardInput,
        });

        if (noteCardResult.isErr()) {
          return err(new ValidationError(noteCardResult.error.message));
        }

        noteCard = noteCardResult.value;

        // Save note card
        const saveNoteCardResult = await this.cardRepository.save(noteCard);
        if (saveNoteCardResult.isErr()) {
          return err(AppError.UnexpectedError.create(saveNoteCardResult.error));
        }

        // Publish note card to library
        const publishNoteCardResult =
          await this.cardPublisher.publishCardToLibrary(noteCard, curatorId);
        if (publishNoteCardResult.isErr()) {
          return err(
            new ValidationError(
              `Failed to publish note card: ${publishNoteCardResult.error.message}`
            )
          );
        }

        // Mark note card as published
        noteCard.addToLibrary(curatorId);
        noteCard.markCardInLibraryAsPublished(
          curatorId,
          publishNoteCardResult.value
        );

        // Update note card in repository
        const updateNoteCardResult = await this.cardRepository.save(noteCard);
        if (updateNoteCardResult.isErr()) {
          return err(
            AppError.UnexpectedError.create(updateNoteCardResult.error)
          );
        }

      }

      // Handle collection additions if specified
      if (request.collectionIds && request.collectionIds.length > 0) {
        // Always add the URL card to collections
        const cardToAdd = urlCard;

        for (const collectionIdStr of request.collectionIds) {
          // Validate collection ID
          const collectionIdResult =
            CollectionId.createFromString(collectionIdStr);
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
            return err(
              AppError.UnexpectedError.create(collectionResult.error)
            );
          }

          const collection = collectionResult.value;
          if (!collection) {
            return err(
              new ValidationError(`Collection not found: ${collectionIdStr}`)
            );
          }

          // Add card to collection
          const addCardResult = collection.addCard(cardToAdd.cardId, curatorId);
          if (addCardResult.isErr()) {
            return err(
              new ValidationError(
                `Failed to add card to collection: ${addCardResult.error.message}`
              )
            );
          }

          // Publish the collection link
          const publishLinkResult =
            await this.collectionPublisher.publishCardAddedToCollection(
              cardToAdd,
              collection,
              curatorId
            );
          if (publishLinkResult.isErr()) {
            return err(
              new ValidationError(
                `Failed to publish collection link: ${publishLinkResult.error.message}`
              )
            );
          }

          // Mark the card link as published in the collection
          collection.markCardLinkAsPublished(
            cardToAdd.cardId,
            publishLinkResult.value
          );

          // Save the updated collection
          const saveCollectionResult =
            await this.collectionRepository.save(collection);
          if (saveCollectionResult.isErr()) {
            return err(
              AppError.UnexpectedError.create(saveCollectionResult.error)
            );
          }
        }
      }

      return ok({
        urlCardId: urlCard.cardId.getStringValue(),
        noteCardId: noteCard?.cardId.getStringValue(),
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
