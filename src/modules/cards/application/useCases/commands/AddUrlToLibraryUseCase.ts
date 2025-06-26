import { Result, ok, err } from "../../../../../shared/core/Result";
import { UseCase } from "../../../../../shared/core/UseCase";
import { UseCaseError } from "../../../../../shared/core/UseCaseError";
import { AppError } from "../../../../../shared/core/AppError";
import { ICardRepository } from "../../../domain/ICardRepository";
import { ICollectionRepository } from "../../../domain/ICollectionRepository";
import { CardFactory, IUrlCardInput, INoteCardInput } from "../../../domain/CardFactory";
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
  publishedUrlCardRecordId?: {
    uri: string;
    cid: string;
  };
  publishedNoteCardRecordId?: {
    uri: string;
    cid: string;
  };
  addedToCollections: Array<{
    collectionId: string;
    collectionRecord?: { uri: string; cid: string };
    publishedLinks: Array<{
      cardId: string;
      linkRecord: { uri: string; cid: string };
    }>;
  }>;
  failedCollections: Array<{
    collectionId: string;
    reason: string;
  }>;
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
      const existingUrlCardResult = await this.cardRepository.findUrlCardByUrl(url);
      if (existingUrlCardResult.isErr()) {
        return err(AppError.UnexpectedError.create(existingUrlCardResult.error));
      }

      let urlCard = existingUrlCardResult.value;
      let publishedUrlCardRecordId;

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
        const publishUrlCardResult = await this.cardPublisher.publishCardToLibrary(
          urlCard,
          curatorId
        );
        if (publishUrlCardResult.isErr()) {
          return err(
            new ValidationError(
              `Failed to publish URL card: ${publishUrlCardResult.error.message}`
            )
          );
        }

        // Mark URL card as published
        urlCard.addToLibrary(curatorId);
        urlCard.markCardInLibraryAsPublished(curatorId, publishUrlCardResult.value);

        // Update URL card in repository
        const updateUrlCardResult = await this.cardRepository.save(urlCard);
        if (updateUrlCardResult.isErr()) {
          return err(AppError.UnexpectedError.create(updateUrlCardResult.error));
        }

        publishedUrlCardRecordId = {
          uri: publishUrlCardResult.value.uri,
          cid: publishUrlCardResult.value.cid,
        };
      } else {
        // Card is already in library, get existing published record if available
        const libraryMembership = urlCard.getLibraryMembership(curatorId);
        if (libraryMembership?.publishedRecordId) {
          publishedUrlCardRecordId = {
            uri: libraryMembership.publishedRecordId.uri,
            cid: libraryMembership.publishedRecordId.cid,
          };
        }
      }

      let noteCard;
      let publishedNoteCardRecordId;

      // Create note card if note is provided
      if (request.note) {
        const noteCardInput: INoteCardInput = {
          type: CardTypeEnum.NOTE,
          content: request.note,
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
        const publishNoteCardResult = await this.cardPublisher.publishCardToLibrary(
          noteCard,
          curatorId
        );
        if (publishNoteCardResult.isErr()) {
          return err(
            new ValidationError(
              `Failed to publish note card: ${publishNoteCardResult.error.message}`
            )
          );
        }

        // Mark note card as published
        noteCard.addToLibrary(curatorId);
        noteCard.markCardInLibraryAsPublished(curatorId, publishNoteCardResult.value);

        // Update note card in repository
        const updateNoteCardResult = await this.cardRepository.save(noteCard);
        if (updateNoteCardResult.isErr()) {
          return err(AppError.UnexpectedError.create(updateNoteCardResult.error));
        }

        publishedNoteCardRecordId = {
          uri: publishNoteCardResult.value.uri,
          cid: publishNoteCardResult.value.cid,
        };
      }

      // Handle collection additions if specified
      const addedToCollections: AddUrlToLibraryResponseDTO["addedToCollections"] = [];
      const failedCollections: Array<{ collectionId: string; reason: string }> = [];

      if (request.collectionIds && request.collectionIds.length > 0) {
        // Determine which card to add to collections (note card if exists, otherwise URL card)
        const cardToAdd = noteCard || urlCard;

        for (const collectionIdStr of request.collectionIds) {
          try {
            // Validate collection ID
            const collectionIdResult = CollectionId.createFromString(collectionIdStr);
            if (collectionIdResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: `Invalid collection ID: ${collectionIdResult.error.message}`,
              });
              continue;
            }

            const collectionId = collectionIdResult.value;

            // Find the collection
            const collectionResult = await this.collectionRepository.findById(collectionId);
            if (collectionResult.isErr()) {
              return err(AppError.UnexpectedError.create(collectionResult.error));
            }

            const collection = collectionResult.value;
            if (!collection) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: "Collection not found",
              });
              continue;
            }

            // Add card to collection
            const addCardResult = collection.addCard(cardToAdd.cardId, curatorId);
            if (addCardResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: addCardResult.error.message,
              });
              continue;
            }

            // Publish the collection link
            const publishLinkResult = await this.collectionPublisher.publishCardAddedToCollection(
              cardToAdd,
              collection,
              curatorId
            );
            if (publishLinkResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: `Failed to publish collection link: ${publishLinkResult.error.message}`,
              });
              continue;
            }

            // Mark the card link as published in the collection
            collection.markCardLinkAsPublished(cardToAdd.cardId, publishLinkResult.value);

            // Save the updated collection
            const saveCollectionResult = await this.collectionRepository.save(collection);
            if (saveCollectionResult.isErr()) {
              failedCollections.push({
                collectionId: collectionIdStr,
                reason: "Failed to save collection",
              });
              continue;
            }

            addedToCollections.push({
              collectionId: collectionIdStr,
              publishedLinks: [{
                cardId: cardToAdd.cardId.getStringValue(),
                linkRecord: {
                  uri: publishLinkResult.value.uri,
                  cid: publishLinkResult.value.cid,
                },
              }],
            });
          } catch (error) {
            failedCollections.push({
              collectionId: collectionIdStr,
              reason: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      }

      return ok({
        urlCardId: urlCard.cardId.getStringValue(),
        noteCardId: noteCard?.cardId.getStringValue(),
        publishedUrlCardRecordId,
        publishedNoteCardRecordId,
        addedToCollections,
        failedCollections,
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
