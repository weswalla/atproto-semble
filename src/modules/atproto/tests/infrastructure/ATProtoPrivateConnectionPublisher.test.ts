import { ATProtoPrivateConnectionPublisher } from '../../infrastructure/publishers/ATProtoPrivateConnectionPublisher';
import { FakeSpacesClient } from '../../infrastructure/services/FakeSpacesClient';
import { Connection } from 'src/modules/cards/domain/Connection';
import { Visibility } from 'src/modules/cards/domain/value-objects/Visibility';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';
import {
  UrlOrCardId,
  UrlOrCardIdType,
} from 'src/modules/cards/domain/value-objects/UrlOrCardId';
import { PublishedRecordId } from 'src/modules/cards/domain/value-objects/PublishedRecordId';
import { buildSpaceUri } from '../../application/ISpacesClient';

const CONNECTION_NSID = 'network.cosmik.connection';
const LIBRARY_SPACE_TYPE = 'network.cosmik.library';

describe('ATProtoPrivateConnectionPublisher', () => {
  const curator = CuratorId.create('did:plc:curator').unwrap();
  const librarySpace = buildSpaceUri(curator.value, LIBRARY_SPACE_TYPE, 'self');
  let spaces: FakeSpacesClient;
  let publisher: ATProtoPrivateConnectionPublisher;

  beforeEach(() => {
    spaces = new FakeSpacesClient();
    publisher = new ATProtoPrivateConnectionPublisher(
      spaces,
      CONNECTION_NSID,
      LIBRARY_SPACE_TYPE,
    );
  });

  function makePrivateConnection() {
    return Connection.create({
      source: UrlOrCardId.reconstruct(
        UrlOrCardIdType.URL,
        'https://example.com/a',
      ).unwrap(),
      target: UrlOrCardId.reconstruct(
        UrlOrCardIdType.URL,
        'https://example.com/b',
      ).unwrap(),
      curatorId: curator,
      visibility: Visibility.PRIVATE,
    }).unwrap();
  }

  it('publish creates the library space on first use and writes the connection record', async () => {
    const connection = makePrivateConnection();
    const result = await publisher.publish(connection);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().uri.startsWith(`${librarySpace}/`)).toBe(true);

    const records = spaces.getRecords(librarySpace);
    expect(records).toHaveLength(1);
    expect(records[0]!.collection).toBe(CONNECTION_NSID);
  });

  it('republish updates the existing space record in place', async () => {
    const connection = makePrivateConnection();
    const first = (await publisher.publish(connection)).unwrap();
    connection.markAsPublished(first);

    const second = (await publisher.publish(connection)).unwrap();
    expect(second.uri).toBe(first.uri);
    expect(spaces.getRecords(librarySpace)).toHaveLength(1);
  });

  it('unpublish deletes the record from the space named by the record uri', async () => {
    const connection = makePrivateConnection();
    const recordId = (await publisher.publish(connection)).unwrap();

    (await publisher.unpublish(recordId)).unwrap();
    expect(spaces.getRecords(librarySpace)).toHaveLength(0);
  });

  it('unpublish rejects a non-space record uri', async () => {
    const result = await publisher.unpublish(
      PublishedRecordId.create({
        uri: `at://${curator.value}/${CONNECTION_NSID}/abc`,
        cid: 'some-cid',
      }),
    );
    expect(result.isErr()).toBe(true);
  });
});
