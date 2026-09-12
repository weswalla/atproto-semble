import { ICollectionPublisher } from 'src/modules/cards/application/ports/ICollectionPublisher';
import { Collection } from 'src/modules/cards/domain/Collection';
import { Card } from 'src/modules/cards/domain/Card';
import { Result } from 'src/shared/core/Result';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import {
  PublishedRecordId,
  PublishedRecordIdProps,
} from 'src/modules/cards/domain/value-objects/PublishedRecordId';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';

/**
 * Routes collection publishing to the public-repo publisher or the private
 * collection-space publisher. Publishes route on the collection's visibility;
 * unpublishes route on the record uri (a collection may have flipped
 * visibility since the record was written, so the uri is authoritative).
 */
export class ATProtoCollectionPublisher implements ICollectionPublisher {
  constructor(
    private readonly publicPublisher: ICollectionPublisher,
    private readonly privatePublisher: ICollectionPublisher,
  ) {}

  private forCollection(collection: Collection): ICollectionPublisher {
    return collection.isPrivateCollection
      ? this.privatePublisher
      : this.publicPublisher;
  }

  publish(
    collection: Collection,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    return this.forCollection(collection).publish(collection);
  }

  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>> {
    // Space record uris embed '/space/'; public repo records never do.
    return recordId.uri.includes('/space/')
      ? this.privatePublisher.unpublish(recordId)
      : this.publicPublisher.unpublish(recordId);
  }

  deleteCollectionSpace(
    spaceRecordId: PublishedRecordId,
  ): Promise<Result<void, UseCaseError>> {
    return this.privatePublisher.deleteCollectionSpace(spaceRecordId);
  }

  publishCardAddedToCollection(
    card: Card,
    collection: Collection,
    curatorId: CuratorId,
    viaCardPublishedRecordId?: PublishedRecordIdProps,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    return this.forCollection(collection).publishCardAddedToCollection(
      card,
      collection,
      curatorId,
      viaCardPublishedRecordId,
    );
  }

  unpublishCardAddedToCollection(
    recordId: PublishedRecordId,
    collection: Collection,
  ): Promise<Result<void, UseCaseError>> {
    // Private membership records are card records inside a space (uri embeds
    // '/space/'); anything else is a public link record (cosmik collectionLink
    // or margin collectionItem) in a plain repo.
    return recordId.uri.includes('/space/')
      ? this.privatePublisher.unpublishCardAddedToCollection(
          recordId,
          collection,
        )
      : this.publicPublisher.unpublishCardAddedToCollection(
          recordId,
          collection,
        );
  }

  publishContributorCardRemoval(
    card: Card,
    collection: Collection,
    curatorId: CuratorId,
    removedRecordRef: PublishedRecordId,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    return this.forCollection(collection).publishContributorCardRemoval(
      card,
      collection,
      curatorId,
      removedRecordRef,
    );
  }
}
