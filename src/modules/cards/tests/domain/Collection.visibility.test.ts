import {
  Collection,
  CollectionAccessType,
} from '../../domain/Collection';
import { Visibility } from '../../domain/value-objects/Visibility';
import { CuratorId } from '../../domain/value-objects/CuratorId';

const author = CuratorId.create('did:plc:author').unwrap();
const other = CuratorId.create('did:plc:other').unwrap();

function makeCollection(
  overrides: {
    accessType?: CollectionAccessType;
    visibility?: Visibility;
  } = {},
) {
  return Collection.create({
    authorId: author,
    name: 'Test Collection',
    accessType: overrides.accessType ?? CollectionAccessType.CLOSED,
    collaboratorIds: [],
    visibility: overrides.visibility,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('Collection visibility', () => {
  it('defaults to PUBLIC with no spaceUri', () => {
    const c = makeCollection().unwrap();
    expect(c.visibility).toBe(Visibility.PUBLIC);
    expect(c.isPublicCollection).toBe(true);
    expect(c.isPrivateCollection).toBe(false);
    expect(c.spaceUri).toBeUndefined();
  });

  it('rejects PRIVATE + OPEN at creation', () => {
    const result = makeCollection({
      accessType: CollectionAccessType.OPEN,
      visibility: Visibility.PRIVATE,
    });
    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.message).toBe(
      'Private collections cannot be open',
    );
  });

  it('rejects changeAccessType(OPEN) on a private collection', () => {
    const c = makeCollection({ visibility: Visibility.PRIVATE }).unwrap();
    const result = c.changeAccessType(CollectionAccessType.OPEN, author);
    expect(result.isErr()).toBe(true);
  });

  it('rejects changeVisibility(PRIVATE) on an OPEN collection', () => {
    const c = makeCollection({
      accessType: CollectionAccessType.OPEN,
    }).unwrap();
    const result = c.changeVisibility(Visibility.PRIVATE, author);
    expect(result.isErr()).toBe(true);
  });

  it('only the author can change visibility', () => {
    const c = makeCollection().unwrap();
    expect(c.changeVisibility(Visibility.PRIVATE, other).isErr()).toBe(true);
    expect(c.changeVisibility(Visibility.PRIVATE, author).isOk()).toBe(true);
    expect(c.isPrivateCollection).toBe(true);
  });

  it('assignSpace / clearSpace manage spaceUri', () => {
    const c = makeCollection({ visibility: Visibility.PRIVATE }).unwrap();
    c.assignSpace(
      'at://did:plc:author/space/network.cosmik.collectionSpace/3abc',
    );
    expect(c.spaceUri).toBe(
      'at://did:plc:author/space/network.cosmik.collectionSpace/3abc',
    );
    c.clearSpace();
    expect(c.spaceUri).toBeUndefined();
  });
});
