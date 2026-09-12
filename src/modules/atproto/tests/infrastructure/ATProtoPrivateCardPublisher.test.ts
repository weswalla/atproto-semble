import { ATProtoPrivateCardPublisher } from '../../infrastructure/publishers/ATProtoPrivateCardPublisher';
import { FakeSpacesClient } from '../../infrastructure/services/FakeSpacesClient';
import { buildSpaceUri } from '../../application/ISpacesClient';
import { DID } from '../../domain/DID';
import { CardFactory } from 'src/modules/cards/domain/CardFactory';
import { Visibility } from 'src/modules/cards/domain/value-objects/Visibility';
import { CardTypeEnum } from 'src/modules/cards/domain/value-objects/CardType';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';
import { UrlMetadata } from 'src/modules/cards/domain/value-objects/UrlMetadata';

const CARD_NSID = 'network.cosmik.card';
const LIBRARY_NSID = 'network.cosmik.library';

describe('ATProtoPrivateCardPublisher', () => {
  const curatorId = CuratorId.create('did:plc:owner').unwrap();
  const curatorDid = DID.create('did:plc:owner').unwrap();
  let spaces: FakeSpacesClient;
  let publisher: ATProtoPrivateCardPublisher;

  beforeEach(() => {
    spaces = new FakeSpacesClient();
    publisher = new ATProtoPrivateCardPublisher(
      spaces,
      CARD_NSID,
      LIBRARY_NSID,
    );
  });

  function makePrivateCard() {
    const card = CardFactory.create({
      curatorId: curatorId.value,
      cardInput: {
        type: CardTypeEnum.URL,
        url: 'https://example.com',
        metadata: UrlMetadata.create({ url: 'https://example.com' }).unwrap(),
      },
      visibility: Visibility.PRIVATE,
    }).unwrap();
    card.addToLibrary(curatorId).unwrap();
    return card;
  }

  it('creates the library space on first publish and writes the card record', async () => {
    const card = makePrivateCard();
    const result = await publisher.publishCardToLibrary(card, curatorId);
    expect(result.isOk()).toBe(true);
    const spaceUri = buildSpaceUri('did:plc:owner', LIBRARY_NSID, 'self');
    expect((await spaces.spaceExists(curatorDid, spaceUri)).unwrap()).toBe(
      true,
    );
    expect(spaces.getRecords(spaceUri)).toHaveLength(1);
    expect(spaces.getRecords(spaceUri)[0]!.collection).toBe(CARD_NSID);
  });

  it('updates in place when the membership already has a published record', async () => {
    const card = makePrivateCard();
    const first = (
      await publisher.publishCardToLibrary(card, curatorId)
    ).unwrap();
    card.markCardInLibraryAsPublished(curatorId, first);
    const second = await publisher.publishCardToLibrary(card, curatorId);
    expect(second.isOk()).toBe(true);
    const spaceUri = buildSpaceUri('did:plc:owner', LIBRARY_NSID, 'self');
    expect(spaces.getRecords(spaceUri)).toHaveLength(1); // put, not a second create
  });

  it('unpublishCardFromLibrary deletes the record from the space', async () => {
    const card = makePrivateCard();
    const rec = (await publisher.publishCardToLibrary(card, curatorId)).unwrap();
    const result = await publisher.unpublishCardFromLibrary(rec, curatorId, {
      isPrivate: true,
    });
    expect(result.isOk()).toBe(true);
    const spaceUri = buildSpaceUri('did:plc:owner', LIBRARY_NSID, 'self');
    expect(spaces.getRecords(spaceUri)).toHaveLength(0);
  });

  it('propagates spaces client failures', async () => {
    const card = makePrivateCard();
    spaces.setShouldFail(true);
    const result = await publisher.publishCardToLibrary(card, curatorId);
    expect(result.isErr()).toBe(true);
  });
});
