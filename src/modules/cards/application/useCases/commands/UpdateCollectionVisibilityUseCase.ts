import { Result, ok, err } from '../../../../../shared/core/Result';
import { BaseUseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IEventPublisher } from '../../../../../shared/application/events/IEventPublisher';
import { ICollectionRepository } from '../../../domain/ICollectionRepository';
import { ICardRepository } from '../../../domain/ICardRepository';
import { ICollectionPublisher } from '../../ports/ICollectionPublisher';
import { CollectionId } from '../../../domain/value-objects/CollectionId';
import { CuratorId } from '../../../domain/value-objects/CuratorId';
import {
  Visibility,
  parseVisibility,
} from '../../../domain/value-objects/Visibility';
import { Collection } from '../../../domain/Collection';
import { Card } from '../../../domain/Card';
import { AuthenticationError } from '../../../../../shared/core/AuthenticationError';

export interface UpdateCollectionVisibilityDTO {
  collectionId: string;
  curatorId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateCollectionVisibilityResponseDTO {
  collectionId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

type UseCaseResult = Result<
  UpdateCollectionVisibilityResponseDTO,
  ValidationError | AuthenticationError | AppError.UnexpectedError
>;

/**
 * Moves a collection between the author's public repo (collection record +
 * collectionLink records) and a permissioned collection space (collection
 * record at rkey=self + card records). Collaborator/contributor scenarios are
 * refused for now.
 */
export class UpdateCollectionVisibilityUseCase extends BaseUseCase<
  UpdateCollectionVisibilityDTO,
  UseCaseResult
> {
  constructor(
    private collectionRepository: ICollectionRepository,
    private cardRepository: ICardRepository,
    private collectionPublisher: ICollectionPublisher,
    eventPublisher: IEventPublisher,
  ) {
    super(eventPublisher);
  }

  async execute(request: UpdateCollectionVisibilityDTO): Promise<UseCaseResult> {
    try {
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`,
          ),
        );
      }
      const curatorId = curatorIdResult.value;

      const collectionIdResult = CollectionId.createFromString(
        request.collectionId,
      );
      if (collectionIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid collection ID: ${collectionIdResult.error.message}`,
          ),
        );
      }

      const visibilityResult = parseVisibility(request.visibility);
      if (visibilityResult.isErr()) {
        return err(new ValidationError(visibilityResult.error.message));
      }
      const targetVisibility = visibilityResult.value;

      const collectionResult = await this.collectionRepository.findById(
        collectionIdResult.value,
      );
      if (collectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(collectionResult.error));
      }
      const collection = collectionResult.value;
      if (!collection) {
        return err(new ValidationError('Collection not found'));
      }
      if (!collection.authorId.equals(curatorId)) {
        return err(
          new ValidationError(
            'Only the collection author can change its visibility',
          ),
        );
      }
      if (collection.visibility === targetVisibility) {
        return ok({
          collectionId: request.collectionId,
          visibility: request.visibility,
        });
      }

      // Collaborator/contributor handling is deferred: refuse rather than
      // silently dropping other people's contributions.
      if (collection.collaboratorIds.length > 0) {
        return err(
          new ValidationError(
            'Cannot change visibility of a collection with collaborators (not yet supported)',
          ),
        );
      }
      const contributorLinks = collection.cardLinks.filter(
        (link) => !link.addedBy.equals(collection.authorId),
      );
      if (contributorLinks.length > 0) {
        return err(
          new ValidationError(
            `Cannot change visibility: ${contributorLinks.length} card(s) were added by contributors (not yet supported)`,
          ),
        );
      }

      // Load the member cards once; both directions republish them.
      const cards = new Map<string, Card>();
      for (const link of collection.cardLinks) {
        const cardResult = await this.cardRepository.findById(link.cardId);
        if (cardResult.isErr()) {
          return err(AppError.UnexpectedError.create(cardResult.error));
        }
        if (!cardResult.value) {
          return err(
            new ValidationError(
              `Card in collection not found: ${link.cardId.getStringValue()}`,
            ),
          );
        }
        cards.set(link.cardId.getStringValue(), cardResult.value);
      }

      if (targetVisibility === Visibility.PRIVATE) {
        return this.convertToPrivate(collection, curatorId, cards, request);
      }
      return this.convertToPublic(collection, curatorId, cards, request);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }

  private async convertToPrivate(
    collection: Collection,
    curatorId: CuratorId,
    cards: Map<string, Card>,
    request: UpdateCollectionVisibilityDTO,
  ): Promise<UseCaseResult> {
    const oldRecordId = collection.publishedRecordId;
    const oldLinkRecords = collection.cardLinks
      .filter((link) => link.publishedRecordId)
      .map((link) => ({
        cardId: link.cardId,
        recordId: link.publishedRecordId!,
      }));

    // changeVisibility enforces the not-OPEN invariant.
    const changeResult = collection.changeVisibility(
      Visibility.PRIVATE,
      curatorId,
    );
    if (changeResult.isErr()) {
      return err(new ValidationError(changeResult.error.message));
    }
    collection.markAsUnpublished();

    // Publish into a new space (assigns spaceUri on the aggregate).
    const publishResult = await this.collectionPublisher.publish(collection);
    if (publishResult.isErr()) {
      if (publishResult.error instanceof AuthenticationError) {
        return err(publishResult.error);
      }
      return err(
        new ValidationError(
          `Failed to publish collection into space: ${publishResult.error.message}`,
        ),
      );
    }
    collection.markAsPublished(publishResult.value);

    // Migrate membership records: write the space card record first, then
    // delete the old public collectionLink (publish-before-delete).
    for (const { cardId, recordId } of oldLinkRecords) {
      const card = cards.get(cardId.getStringValue())!;
      const spaceRecordResult =
        await this.collectionPublisher.publishCardAddedToCollection(
          card,
          collection,
          curatorId,
        );
      if (spaceRecordResult.isErr()) {
        if (spaceRecordResult.error instanceof AuthenticationError) {
          return err(spaceRecordResult.error);
        }
        return err(
          new ValidationError(
            `Failed to republish card into space: ${spaceRecordResult.error.message}`,
          ),
        );
      }
      collection.markCardLinkAsPublished(cardId, spaceRecordResult.value);

      // Routed to the public publisher by the composite (the record uri is a
      // repo collectionLink uri, not a space uri).
      const unpublishLink =
        await this.collectionPublisher.unpublishCardAddedToCollection(
          recordId,
          collection,
        );
      if (unpublishLink.isErr()) {
        if (unpublishLink.error instanceof AuthenticationError) {
          return err(unpublishLink.error);
        }
        return err(
          new ValidationError(
            `Failed to unpublish collection link: ${unpublishLink.error.message}`,
          ),
        );
      }
    }

    // Delete the old public collection record last.
    if (oldRecordId) {
      const unpublishResult =
        await this.collectionPublisher.unpublish(oldRecordId);
      if (unpublishResult.isErr()) {
        if (unpublishResult.error instanceof AuthenticationError) {
          return err(unpublishResult.error);
        }
        return err(
          new ValidationError(
            `Failed to unpublish public collection record: ${unpublishResult.error.message}`,
          ),
        );
      }
    }

    return this.persist(collection, request);
  }

  private async convertToPublic(
    collection: Collection,
    curatorId: CuratorId,
    cards: Map<string, Card>,
    request: UpdateCollectionVisibilityDTO,
  ): Promise<UseCaseResult> {
    // Private cards cannot appear in a public collection.
    const privateCards = [...cards.values()].filter((card) => card.isPrivate);
    if (privateCards.length > 0) {
      return err(
        new ValidationError(
          `Cannot make collection public: it contains ${privateCards.length} private card(s). Make them public or remove them first.`,
        ),
      );
    }

    const spaceUriBefore = collection.spaceUri;

    const changeResult = collection.changeVisibility(
      Visibility.PUBLIC,
      curatorId,
    );
    if (changeResult.isErr()) {
      return err(new ValidationError(changeResult.error.message));
    }
    collection.markAsUnpublished();

    // Publish the public collection record.
    const publishResult = await this.collectionPublisher.publish(collection);
    if (publishResult.isErr()) {
      if (publishResult.error instanceof AuthenticationError) {
        return err(publishResult.error);
      }
      return err(
        new ValidationError(
          `Failed to publish public collection record: ${publishResult.error.message}`,
        ),
      );
    }
    collection.markAsPublished(publishResult.value);

    // Republish each membership as a public collectionLink. The old card
    // records inside the space disappear with the space itself below.
    for (const link of collection.cardLinks) {
      const card = cards.get(link.cardId.getStringValue())!;
      const linkResult =
        await this.collectionPublisher.publishCardAddedToCollection(
          card,
          collection,
          curatorId,
        );
      if (linkResult.isErr()) {
        if (linkResult.error instanceof AuthenticationError) {
          return err(linkResult.error);
        }
        return err(
          new ValidationError(
            `Failed to publish collection link: ${linkResult.error.message}`,
          ),
        );
      }
      collection.markCardLinkAsPublished(link.cardId, linkResult.value);
    }

    // Tear down the space last (needs collection.spaceUri, so before clearSpace).
    if (spaceUriBefore) {
      const deleteResult =
        await this.collectionPublisher.deleteCollectionSpace(collection);
      if (deleteResult.isErr()) {
        if (deleteResult.error instanceof AuthenticationError) {
          return err(deleteResult.error);
        }
        return err(
          new ValidationError(
            `Failed to delete collection space: ${deleteResult.error.message}`,
          ),
        );
      }
    }
    collection.clearSpace();

    return this.persist(collection, request);
  }

  private async persist(
    collection: Collection,
    request: UpdateCollectionVisibilityDTO,
  ): Promise<UseCaseResult> {
    // Metadata (visibility, spaceUri, publishedRecordId) via updateMetadata;
    // link publishedRecordId changes ride the aggregate's pending commands.
    const metadataResult = await this.collectionRepository.updateMetadata(
      collection.collectionId,
      {
        visibility: collection.visibility,
        spaceUri: collection.spaceUri ?? null,
        publishedRecordId: collection.publishedRecordId,
      },
    );
    if (metadataResult.isErr()) {
      return err(AppError.UnexpectedError.create(metadataResult.error));
    }

    if (collection.hasPendingCommands()) {
      const saveResult = await this.collectionRepository.save(collection);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }
    }

    return ok({
      collectionId: request.collectionId,
      visibility: request.visibility,
    });
  }
}
