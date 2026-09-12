import { Collection } from '../../domain/Collection';
import { Result } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { Card } from '../../domain/Card';
import {
  PublishedRecordId,
  PublishedRecordIdProps,
} from '../../domain/value-objects/PublishedRecordId';
import { CuratorId } from '../../domain/value-objects/CuratorId';

export interface ICollectionPublisher {
  /**
   * Publishes the collection record. For PUBLIC collections this writes to the
   * author's repo; for PRIVATE collections it writes into the collection's
   * permissioned space, creating the space when the collection has no
   * space-scoped published record yet. The returned record id's at-uri carries
   * all space information.
   */
  publish(
    collection: Collection,
  ): Promise<Result<PublishedRecordId, UseCaseError>>;

  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>>;

  /**
   * Deletes the permissioned space that the given space-scoped record lives
   * in (private collections only). No-op for plain repo records.
   */
  deleteCollectionSpace(
    spaceRecordId: PublishedRecordId,
  ): Promise<Result<void, UseCaseError>>;

  publishCardAddedToCollection(
    card: Card,
    collection: Collection,
    curatorId: CuratorId,
    viaCardPublishedRecordId?: PublishedRecordIdProps,
  ): Promise<Result<PublishedRecordId, UseCaseError>>;

  unpublishCardAddedToCollection(
    recordId: PublishedRecordId,
    collection: Collection,
  ): Promise<Result<void, UseCaseError>>;

  /**
   * Removal tombstone published by the collection owner when they cannot
   * delete the member's own record: a collectionLinkRemoval record (public
   * collections) or a cardRemoval record in the collection space (private
   * collections). Renamed from publishCollectionLinkRemoval.
   */
  publishContributorCardRemoval(
    card: Card,
    collection: Collection,
    curatorId: CuratorId,
    removedRecordRef: PublishedRecordId,
  ): Promise<Result<PublishedRecordId, UseCaseError>>;
}
