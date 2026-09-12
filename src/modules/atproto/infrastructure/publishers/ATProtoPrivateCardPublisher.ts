import {
  ICardPublisher,
  UnpublishCardOptions,
} from 'src/modules/cards/application/ports/ICardPublisher';
import { Card } from 'src/modules/cards/domain/Card';
import { Result, ok, err } from 'src/shared/core/Result';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';
import { PublishedRecordId } from 'src/modules/cards/domain/value-objects/PublishedRecordId';
import { CardMapper } from '../mappers/CardMapper';
import { DID } from '../../domain/DID';
import { ISpacesClient, buildSpaceUri } from '../../application/ISpacesClient';

/**
 * Publishes cards into the curator's private library space
 * (at://{did}/space/{librarySpaceType}/self), creating the space on first use.
 */
export class ATProtoPrivateCardPublisher implements ICardPublisher {
  constructor(
    private readonly spacesClient: ISpacesClient,
    private readonly cardCollection: string,
    private readonly librarySpaceType: string,
  ) {}

  private librarySpaceUri(did: DID): string {
    return buildSpaceUri(did.value, this.librarySpaceType, 'self');
  }

  private async ensureLibrarySpace(did: DID): Promise<Result<string, Error>> {
    const spaceUri = this.librarySpaceUri(did);
    const exists = await this.spacesClient.spaceExists(did, spaceUri);
    if (exists.isErr()) return err(exists.error);
    if (!exists.value) {
      const created = await this.spacesClient.createSpace(
        did,
        this.librarySpaceType,
        'self',
      );
      if (created.isErr()) return err(created.error);
      return ok(created.value.uri);
    }
    return ok(spaceUri);
  }

  async publishCardToLibrary(
    card: Card,
    curatorId: CuratorId,
    parentCardPublishedRecordId?: PublishedRecordId,
    viaCardPublishedRecordId?: PublishedRecordId,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      const didResult = DID.create(curatorId.value);
      if (didResult.isErr()) {
        return err(
          new Error(`Invalid curator DID: ${didResult.error.message}`),
        );
      }
      const did = didResult.value;

      const spaceResult = await this.ensureLibrarySpace(did);
      if (spaceResult.isErr()) return err(spaceResult.error);
      const space = spaceResult.value;

      const record = CardMapper.toCreateRecordDTO(
        card,
        curatorId,
        parentCardPublishedRecordId,
        viaCardPublishedRecordId,
      );
      record.$type = this.cardCollection as any;

      // If this curator already has a record for the card in their library
      // space, update it in place at the same rkey.
      const existingMembership = card.libraryMemberships.find(
        (m) => m.curatorId.equals(curatorId) && m.publishedRecordId,
      );

      if (existingMembership?.publishedRecordId) {
        const rkey = existingMembership.publishedRecordId.uri
          .split('/')
          .pop()!;
        const putResult = await this.spacesClient.putRecord({
          space,
          repo: did,
          collection: this.cardCollection,
          rkey,
          record: record as unknown as Record<string, unknown>,
        });
        if (putResult.isErr()) return err(putResult.error);
        return ok(PublishedRecordId.create(putResult.value));
      }

      const createResult = await this.spacesClient.createRecord({
        space,
        repo: did,
        collection: this.cardCollection,
        record: record as unknown as Record<string, unknown>,
      });
      if (createResult.isErr()) return err(createResult.error);
      return ok(PublishedRecordId.create(createResult.value));
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async unpublishCardFromLibrary(
    recordId: PublishedRecordId,
    curatorId: CuratorId,
    _options?: UnpublishCardOptions,
  ): Promise<Result<void, UseCaseError>> {
    try {
      const didResult = DID.create(curatorId.value);
      if (didResult.isErr()) {
        return err(
          new Error(`Invalid curator DID: ${didResult.error.message}`),
        );
      }
      const did = didResult.value;
      const rkey = recordId.uri.split('/').pop()!;
      const deleteResult = await this.spacesClient.deleteRecord({
        space: this.librarySpaceUri(did),
        repo: did,
        collection: this.cardCollection,
        rkey,
      });
      if (deleteResult.isErr()) return err(deleteResult.error);
      return ok(undefined);
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
