import { Connection } from '../../domain/Connection';
import { Visibility } from '../../domain/value-objects/Visibility';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import {
  UrlOrCardId,
  UrlOrCardIdType,
} from '../../domain/value-objects/UrlOrCardId';

const curator = CuratorId.create('did:plc:curator').unwrap();

function makeConnection(visibility?: Visibility) {
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
    visibility,
  }).unwrap();
}

describe('Connection visibility', () => {
  it('defaults to PUBLIC', () => {
    const connection = makeConnection();
    expect(connection.visibility).toBe(Visibility.PUBLIC);
    expect(connection.isPublic).toBe(true);
    expect(connection.isPrivate).toBe(false);
  });

  it('can be created PRIVATE', () => {
    const connection = makeConnection(Visibility.PRIVATE);
    expect(connection.isPrivate).toBe(true);
  });

  it('changeVisibility flips visibility and is a no-op when unchanged', () => {
    const connection = makeConnection();
    expect(connection.changeVisibility(Visibility.PUBLIC).isOk()).toBe(true);
    expect(connection.isPublic).toBe(true);
    expect(connection.changeVisibility(Visibility.PRIVATE).isOk()).toBe(true);
    expect(connection.isPrivate).toBe(true);
  });
});
