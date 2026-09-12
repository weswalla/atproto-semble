import { ICollectionPublisher } from 'src/modules/cards/application/ports/ICollectionPublisher';
import { Collection } from 'src/modules/cards/domain/Collection';
import { Card } from 'src/modules/cards/domain/Card';
import { Result, ok, err } from 'src/shared/core/Result';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import {
  PublishedRecordId,
  PublishedRecordIdProps,
} from 'src/modules/cards/domain/value-objects/PublishedRecordId';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';
import { CollectionMapper } from '../mappers/CollectionMapper';
import { CardMapper } from '../mappers/CardMapper';
import { DID } from '../../domain/DID';
import {
  ISpacesClient,
  generateSpaceKey,
} from '../../application/ISpacesClient';

export interface PrivateCollectionNsids {
  collection: string;
  card: string;
  cardRemoval: string;
  collectionSpaceType: string;
}

/**
 * Publishes private collections into permissioned collection spaces.
 * The collection record lives at rkey=self inside the space; membership is a
 * card record per contributed card; owner-removals of contributor records are
 * cardRemoval tombstones.
 */
export class ATProtoPrivateCollectionPublisher implements ICollectionPublisher {
  constructor(
    private readonly spacesClient: ISpacesClient,
    private readonly nsids: PrivateCollectionNsids,
  ) {}

  private did(value: string): Result<DID, Error> {
    const didResult = DID.create(value);
    if (didResult.isErr()) {
      return err(new Error(`Invalid DID: ${didResult.error.message}`));
    }
    return ok(didResult.value);
  }

  private toError(error: unknown): Error {
    return new Error(error instanceof Error ? error.message : String(error));
  }

  /**
   * Publishes the collection record into its space, creating the space (and
   * assigning it on the aggregate — callers must persist the collection) when
   * none exists yet.
   */
  async publish(
    collection: Collection,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      const didResult = this.did(collection.authorId.value);
      if (didResult.isErr()) return err(didResult.error);
      const authorDid = didResult.value;

      let space = collection.spaceUri;
      if (!space) {
        const created = await this.spacesClient.createSpace(
          authorDid,
          this.nsids.collectionSpaceType,
          generateSpaceKey(),
        );
        if (created.isErr()) return err(created.error);
        space = created.value.uri;
        collection.assignSpace(space);
      }

      const recordDTO = CollectionMapper.toCreateRecordDTO(collection);
      recordDTO.$type = this.nsids.collection as any;

      const putResult = await this.spacesClient.putRecord({
        space,
        repo: authorDid,
        collection: this.nsids.collection,
        rkey: 'self',
        record: recordDTO as unknown as Record<string, unknown>,
      });
      if (putResult.isErr()) return err(putResult.error);
      return ok(PublishedRecordId.create(putResult.value));
    } catch (error) {
      return err(this.toError(error));
    }
  }

  /**
   * Deletes the rkey=self collection record inside the space. Full space
   * teardown is deleteCollectionSpace.
   */
  async unpublish(
    recordId: PublishedRecordId,
  ): Promise<Result<void, UseCaseError>> {
    try {
      // uri shape: <spaceUri>/<collectionNsid>/self
      const marker = `/${this.nsids.collection}/`;
      const idx = recordId.uri.lastIndexOf(marker);
      if (idx === -1) {
        return err(
          new Error(`Not a space collection record: ${recordId.uri}`),
        );
      }
      const space = recordId.uri.slice(0, idx);
      const ownerDidValue = space.replace('at://', '').split('/')[0]!;
      const didResult = this.did(ownerDidValue);
      if (didResult.isErr()) return err(didResult.error);
      const del = await this.spacesClient.deleteRecord({
        space,
        repo: didResult.value,
        collection: this.nsids.collection,
        rkey: 'self',
      });
      if (del.isErr()) return err(del.error);
      return ok(undefined);
    } catch (error) {
      return err(this.toError(error));
    }
  }

  async deleteCollectionSpace(
    collection: Collection,
  ): Promise<Result<void, UseCaseError>> {
    try {
      if (!collection.spaceUri) return ok(undefined);
      const didResult = this.did(collection.authorId.value);
      if (didResult.isErr()) return err(didResult.error);
      const del = await this.spacesClient.deleteSpace(
        didResult.value,
        collection.spaceUri,
      );
      if (del.isErr()) return err(del.error);
      return ok(undefined);
    } catch (error) {
      return err(this.toError(error));
    }
  }

  /**
   * Membership in a private collection: a card record written into the
   * collection space by the contributing member's repo.
   */
  async publishCardAddedToCollection(
    card: Card,
    collection: Collection,
    curatorId: CuratorId,
    viaCardPublishedRecordId?: PublishedRecordIdProps,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      if (!collection.spaceUri) {
        return err(
          new Error('Collection space must exist before adding cards'),
        );
      }
      const didResult = this.did(curatorId.value);
      if (didResult.isErr()) return err(didResult.error);

      const record = CardMapper.toCreateRecordDTO(
        card,
        curatorId,
        undefined,
        viaCardPublishedRecordId
          ? PublishedRecordId.create(viaCardPublishedRecordId)
          : undefined,
      );
      record.$type = this.nsids.card as any;

      const createResult = await this.spacesClient.createRecord({
        space: collection.spaceUri,
        repo: didResult.value,
        collection: this.nsids.card,
        record: record as unknown as Record<string, unknown>,
      });
      if (createResult.isErr()) return err(createResult.error);
      return ok(PublishedRecordId.create(createResult.value));
    } catch (error) {
      return err(this.toError(error));
    }
  }

  /**
   * Deletes a member's own card record from the collection space. The repo is
   * derived from the collection's card link that carries this record id (the
   * record uri alone does not encode whose permissioned repo it lives in);
   * owner-removals of other members' records go through
   * publishContributorCardRemoval instead.
   */
  async unpublishCardAddedToCollection(
    recordId: PublishedRecordId,
    collection: Collection,
  ): Promise<Result<void, UseCaseError>> {
    try {
      if (!collection.spaceUri) return ok(undefined);
      const link = collection.cardLinks.find(
        (l) => l.publishedRecordId?.uri === recordId.uri,
      );
      const repoOwner = link?.addedBy ?? collection.authorId;
      const didResult = this.did(repoOwner.value);
      if (didResult.isErr()) return err(didResult.error);
      const rkey = recordId.uri.split('/').pop()!;
      const del = await this.spacesClient.deleteRecord({
        space: collection.spaceUri,
        repo: didResult.value,
        collection: this.nsids.card,
        rkey,
      });
      if (del.isErr()) return err(del.error);
      return ok(undefined);
    } catch (error) {
      return err(this.toError(error));
    }
  }

  /**
   * cardRemoval tombstone written by the collection owner when removing a
   * record that lives in another member's permissioned repo.
   */
  async publishContributorCardRemoval(
    _card: Card,
    collection: Collection,
    curatorId: CuratorId,
    removedRecordRef: PublishedRecordId,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      if (!collection.spaceUri || !collection.publishedRecordId) {
        return err(
          new Error(
            'Collection must be published in its space before removals',
          ),
        );
      }
      const didResult = this.did(curatorId.value);
      if (didResult.isErr()) return err(didResult.error);

      const record = {
        $type: this.nsids.cardRemoval,
        collection: collection.publishedRecordId.getValue(),
        removedCard: removedRecordRef.getValue(),
        removedAt: new Date().toISOString(),
      };

      const createResult = await this.spacesClient.createRecord({
        space: collection.spaceUri,
        repo: didResult.value,
        collection: this.nsids.cardRemoval,
        record,
      });
      if (createResult.isErr()) return err(createResult.error);
      return ok(PublishedRecordId.create(createResult.value));
    } catch (error) {
      return err(this.toError(error));
    }
  }
}
