import { IConnectionPublisher } from 'src/modules/cards/application/ports/IConnectionPublisher';
import { Connection } from 'src/modules/cards/domain/Connection';
import { Result, ok, err } from 'src/shared/core/Result';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { PublishedRecordId } from 'src/modules/cards/domain/value-objects/PublishedRecordId';
import { ConnectionMapper } from '../mappers/ConnectionMapper';
import { DID } from '../../domain/DID';
import {
  ISpacesClient,
  buildSpaceUri,
  extractSpaceUriFromRecordUri,
} from '../../application/ISpacesClient';

/**
 * Publishes connections into the curator's private library space
 * (at://{did}/space/{librarySpaceType}/self) — the same space that holds their
 * private cards — creating the space on first use.
 */
export class ATProtoPrivateConnectionPublisher implements IConnectionPublisher {
  constructor(
    private readonly spacesClient: ISpacesClient,
    private readonly connectionCollection: string,
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

  async publish(
    connection: Connection,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      const didResult = DID.create(connection.curatorId.value);
      if (didResult.isErr()) {
        return err(
          new Error(`Invalid curator DID: ${didResult.error.message}`),
        );
      }
      const did = didResult.value;

      const spaceResult = await this.ensureLibrarySpace(did);
      if (spaceResult.isErr()) return err(spaceResult.error);
      const space = spaceResult.value;

      const record = ConnectionMapper.toCreateRecordDTO(connection);
      record.$type = this.connectionCollection as any;

      // If the connection already lives in the space, update it in place at
      // the same rkey.
      if (
        connection.publishedRecordId &&
        extractSpaceUriFromRecordUri(connection.publishedRecordId.uri)
      ) {
        const rkey = connection.publishedRecordId.uri.split('/').pop()!;
        const putResult = await this.spacesClient.putRecord({
          space,
          repo: did,
          collection: this.connectionCollection,
          rkey,
          record: record as unknown as Record<string, unknown>,
        });
        if (putResult.isErr()) return err(putResult.error);
        return ok(PublishedRecordId.create(putResult.value));
      }

      const createResult = await this.spacesClient.createRecord({
        space,
        repo: did,
        collection: this.connectionCollection,
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

  async unpublish(
    recordId: PublishedRecordId,
  ): Promise<Result<void, UseCaseError>> {
    try {
      const space = extractSpaceUriFromRecordUri(recordId.uri);
      if (!space) {
        return err(new Error(`Not a space connection record: ${recordId.uri}`));
      }
      // The space uri's authority segment is the owner's DID.
      const ownerDidValue = space.replace('at://', '').split('/')[0]!;
      const didResult = DID.create(ownerDidValue);
      if (didResult.isErr()) {
        return err(new Error(`Invalid owner DID: ${didResult.error.message}`));
      }
      const rkey = recordId.uri.split('/').pop()!;
      const deleteResult = await this.spacesClient.deleteRecord({
        space,
        repo: didResult.value,
        collection: this.connectionCollection,
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
