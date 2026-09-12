import { FakeSpacesClient } from '../../infrastructure/services/FakeSpacesClient';
import { DID } from '../../domain/DID';
import { buildSpaceUri } from '../../application/ISpacesClient';

describe('FakeSpacesClient', () => {
  const did = DID.create('did:plc:owner').unwrap();

  it('creates a space, writes/reads/deletes records, deletes the space', async () => {
    const client = new FakeSpacesClient();
    const space = (
      await client.createSpace(did, 'network.cosmik.library', 'self')
    ).unwrap();
    expect(space.uri).toBe(
      buildSpaceUri('did:plc:owner', 'network.cosmik.library', 'self'),
    );
    expect((await client.spaceExists(did, space.uri)).unwrap()).toBe(true);

    const rec = (
      await client.createRecord({
        space: space.uri,
        repo: did,
        collection: 'network.cosmik.card',
        record: { $type: 'network.cosmik.card' },
      })
    ).unwrap();
    expect(rec.uri.startsWith(space.uri)).toBe(true);
    expect(client.getRecords(space.uri)).toHaveLength(1);

    const rkey = rec.uri.split('/').pop()!;
    (
      await client.deleteRecord({
        space: space.uri,
        repo: did,
        collection: 'network.cosmik.card',
        rkey,
      })
    ).unwrap();
    expect(client.getRecords(space.uri)).toHaveLength(0);

    (await client.deleteSpace(did, space.uri)).unwrap();
    expect((await client.spaceExists(did, space.uri)).unwrap()).toBe(false);
    expect(client.getDeletedSpaces()).toContain(space.uri);
  });

  it('putRecord updates in place', async () => {
    const client = new FakeSpacesClient();
    const space = (
      await client.createSpace(did, 'network.cosmik.collectionSpace', '3abc')
    ).unwrap();
    const first = (
      await client.putRecord({
        space: space.uri,
        repo: did,
        collection: 'network.cosmik.collection',
        rkey: 'self',
        record: { name: 'v1' },
      })
    ).unwrap();
    const second = (
      await client.putRecord({
        space: space.uri,
        repo: did,
        collection: 'network.cosmik.collection',
        rkey: 'self',
        record: { name: 'v2' },
      })
    ).unwrap();
    expect(second.uri).toBe(first.uri);
    expect(second.cid).not.toBe(first.cid);
    expect(client.getRecords(space.uri)).toHaveLength(1);
    expect(client.getRecords(space.uri)[0]!.record).toEqual({ name: 'v2' });
  });

  it('record operations fail on a missing space', async () => {
    const client = new FakeSpacesClient();
    const result = await client.createRecord({
      space: 'at://did:plc:owner/space/network.cosmik.library/self',
      repo: did,
      collection: 'network.cosmik.card',
      record: {},
    });
    expect(result.isErr()).toBe(true);
  });
});
