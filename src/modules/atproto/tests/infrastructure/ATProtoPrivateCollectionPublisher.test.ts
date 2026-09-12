import { ATProtoPrivateCollectionPublisher } from '../../infrastructure/publishers/ATProtoPrivateCollectionPublisher';
import { FakeSpacesClient } from '../../infrastructure/services/FakeSpacesClient';
import {
  Collection,
  CollectionAccessType,
} from 'src/modules/cards/domain/Collection';
import { Visibility } from 'src/modules/cards/domain/value-objects/Visibility';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';
import { CardFactory } from 'src/modules/cards/domain/CardFactory';
import { CardTypeEnum } from 'src/modules/cards/domain/value-objects/CardType';
import { UrlMetadata } from 'src/modules/cards/domain/value-objects/UrlMetadata';

const NSIDS = {
  collection: 'network.cosmik.collection',
  card: 'network.cosmik.card',
  cardRemoval: 'network.cosmik.cardRemoval',
  collectionSpaceType: 'network.cosmik.collectionSpace',
};

describe('ATProtoPrivateCollectionPublisher', () => {
  const author = CuratorId.create('did:plc:author').unwrap();
  let spaces: FakeSpacesClient;
  let publisher: ATProtoPrivateCollectionPublisher;

  beforeEach(() => {
    spaces = new FakeSpacesClient();
    publisher = new ATProtoPrivateCollectionPublisher(spaces, NSIDS);
  });

  function makePrivateCollection() {
    return Collection.create({
      authorId: author,
      name: 'Secrets',
      accessType: CollectionAccessType.CLOSED,
      collaboratorIds: [],
      visibility: Visibility.PRIVATE,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).unwrap();
  }

  function makePrivateCard() {
    const card = CardFactory.create({
      curatorId: author.value,
      cardInput: {
        type: CardTypeEnum.URL,
        url: 'https://example.com',
        metadata: UrlMetadata.create({ url: 'https://example.com' }).unwrap(),
      },
      visibility: Visibility.PRIVATE,
    }).unwrap();
    card.addToLibrary(author).unwrap();
    return card;
  }

  it('publish creates a space, assigns it, and writes the collection record at rkey=self', async () => {
    const collection = makePrivateCollection();
    const result = await publisher.publish(collection);
    expect(result.isOk()).toBe(true);
    expect(collection.spaceUri).toBeDefined();
    const records = spaces.getRecords(collection.spaceUri!);
    expect(records).toHaveLength(1);
    expect(records[0]!.collection).toBe(NSIDS.collection);
    expect(records[0]!.rkey).toBe('self');
  });

  it('republish reuses the existing space and updates rkey=self in place', async () => {
    const collection = makePrivateCollection();
    (await publisher.publish(collection)).unwrap();
    const spaceUri = collection.spaceUri!;
    (await publisher.publish(collection)).unwrap();
    expect(collection.spaceUri).toBe(spaceUri);
    expect(spaces.getRecords(spaceUri)).toHaveLength(1);
  });

  it('publishCardAddedToCollection writes a card record into the space', async () => {
    const collection = makePrivateCollection();
    (await publisher.publish(collection)).unwrap();
    const card = makePrivateCard();
    collection.addCard(card.cardId, author).unwrap();

    const linkResult = await publisher.publishCardAddedToCollection(
      card,
      collection,
      author,
    );
    expect(linkResult.isOk()).toBe(true);
    const cardRecords = spaces
      .getRecords(collection.spaceUri!)
      .filter((r) => r.collection === NSIDS.card);
    expect(cardRecords).toHaveLength(1);
  });

  it('unpublishCardAddedToCollection deletes the card record from the space', async () => {
    const collection = makePrivateCollection();
    (await publisher.publish(collection)).unwrap();
    const card = makePrivateCard();
    collection.addCard(card.cardId, author).unwrap();
    const linkRecord = (
      await publisher.publishCardAddedToCollection(card, collection, author)
    ).unwrap();
    collection.markCardLinkAsPublished(card.cardId, linkRecord);

    (
      await publisher.unpublishCardAddedToCollection(linkRecord, collection)
    ).unwrap();
    const cardRecords = spaces
      .getRecords(collection.spaceUri!)
      .filter((r) => r.collection === NSIDS.card);
    expect(cardRecords).toHaveLength(0);
  });

  it('publishContributorCardRemoval writes a cardRemoval tombstone', async () => {
    const collection = makePrivateCollection();
    const collectionRecord = (await publisher.publish(collection)).unwrap();
    collection.markAsPublished(collectionRecord);
    const card = makePrivateCard();
    collection.addCard(card.cardId, author).unwrap();
    const linkRecord = (
      await publisher.publishCardAddedToCollection(card, collection, author)
    ).unwrap();

    const removal = await publisher.publishContributorCardRemoval(
      card,
      collection,
      author,
      linkRecord,
    );
    expect(removal.isOk()).toBe(true);
    const removalRecords = spaces
      .getRecords(collection.spaceUri!)
      .filter((r) => r.collection === NSIDS.cardRemoval);
    expect(removalRecords).toHaveLength(1);
    expect(removalRecords[0]!.record.removedCard).toEqual(
      linkRecord.getValue(),
    );
  });

  it('deleteCollectionSpace deletes the space', async () => {
    const collection = makePrivateCollection();
    (await publisher.publish(collection)).unwrap();
    const spaceUri = collection.spaceUri!;
    (await publisher.deleteCollectionSpace(collection)).unwrap();
    expect(spaces.getDeletedSpaces()).toContain(spaceUri);
  });
});
