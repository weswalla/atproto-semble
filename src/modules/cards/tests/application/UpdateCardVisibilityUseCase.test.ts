import { UpdateCardVisibilityUseCase } from '../../application/useCases/commands/UpdateCardVisibilityUseCase';
import { AddUrlToLibraryUseCase } from '../../application/useCases/commands/AddUrlToLibraryUseCase';
import { InMemoryCardRepository } from '../utils/InMemoryCardRepository';
import { InMemoryCollectionRepository } from '../utils/InMemoryCollectionRepository';
import { FakeCardPublisher } from '../utils/FakeCardPublisher';
import { FakeCollectionPublisher } from '../utils/FakeCollectionPublisher';
import { FakeMetadataService } from '../utils/FakeMetadataService';
import { CardLibraryService } from '../../domain/services/CardLibraryService';
import { CardCollectionService } from '../../domain/services/CardCollectionService';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { CardId } from '../../domain/value-objects/CardId';
import { CollectionBuilder } from '../utils/builders/CollectionBuilder';
import { FakeEventPublisher } from '../utils/FakeEventPublisher';
import { Card } from '../../domain/Card';
import { Visibility } from '../../domain/value-objects/Visibility';

describe('UpdateCardVisibilityUseCase', () => {
  let useCase: UpdateCardVisibilityUseCase;
  let addUrlToLibraryUseCase: AddUrlToLibraryUseCase;
  let cardRepository: InMemoryCardRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let cardPublisher: FakeCardPublisher;
  let collectionPublisher: FakeCollectionPublisher;
  let metadataService: FakeMetadataService;
  let cardLibraryService: CardLibraryService;
  let cardCollectionService: CardCollectionService;
  let eventPublisher: FakeEventPublisher;
  let curatorId: CuratorId;

  beforeEach(() => {
    cardRepository = InMemoryCardRepository.getInstance();
    collectionRepository = InMemoryCollectionRepository.getInstance();
    cardPublisher = new FakeCardPublisher();
    collectionPublisher = new FakeCollectionPublisher();
    metadataService = new FakeMetadataService();
    eventPublisher = new FakeEventPublisher();

    cardCollectionService = new CardCollectionService(
      collectionRepository,
      collectionPublisher,
      cardRepository,
    );
    cardLibraryService = new CardLibraryService(
      cardRepository,
      cardPublisher,
      collectionRepository,
      cardCollectionService,
    );

    useCase = new UpdateCardVisibilityUseCase(
      cardRepository,
      collectionRepository,
      cardPublisher,
      eventPublisher,
    );

    addUrlToLibraryUseCase = new AddUrlToLibraryUseCase(
      cardRepository,
      metadataService,
      cardLibraryService,
      cardCollectionService,
      eventPublisher,
    );

    curatorId = CuratorId.create('did:plc:testcurator').unwrap();
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    cardPublisher.clear();
    collectionPublisher.clear();
    metadataService.clear();
    eventPublisher.clear();
  });

  async function savedCard(
    url: string,
    isPrivate = false,
  ): Promise<Card> {
    const result = await addUrlToLibraryUseCase.execute({
      url,
      curatorId: curatorId.value,
      isPrivate,
    });
    expect(result.isOk()).toBe(true);
    return (
      await cardRepository.findById(
        CardId.createFromString(result.unwrap().urlCardId).unwrap(),
      )
    ).unwrap()!;
  }

  it('converts a public card to private: unpublishes the repo record and republishes to the library space', async () => {
    const card = await savedCard('https://example.com/pub');
    const oldRecord = card.getLibraryInfo(curatorId)!.publishedRecordId!;

    const result = await useCase.execute({
      cardId: card.cardId.getStringValue(),
      curatorId: curatorId.value,
      visibility: 'PRIVATE',
    });
    expect(result.isOk()).toBe(true);

    const updated = (await cardRepository.findById(card.cardId)).unwrap()!;
    expect(updated.isPrivate).toBe(true);

    // old record unpublished from the public repo
    const unpublished = cardPublisher
      .getUnpublishedCards()
      .find((r) => r.uri === oldRecord.uri);
    expect(unpublished).toBeDefined();
    expect(unpublished!.isPrivate).toBe(false);

    // new record published to the library space
    const newRecord = updated.getLibraryInfo(curatorId)!.publishedRecordId!;
    expect(newRecord.uri).not.toBe(oldRecord.uri);
    expect(
      cardPublisher.getPublishTarget(newRecord.uri, newRecord.cid),
    ).toBe('librarySpace');
  });

  it('refuses public→private while the card is in a public collection', async () => {
    const card = await savedCard('https://example.com/in-collection');
    const publicCollection = new CollectionBuilder()
      .withAuthorId(curatorId.value)
      .withName('Public Collection')
      .withAccessType('CLOSED')
      .build();
    if (publicCollection instanceof Error) throw publicCollection;
    await collectionRepository.save(publicCollection);
    const addResult = await cardCollectionService.addCardToCollection(
      card,
      publicCollection.collectionId,
      curatorId,
    );
    expect(addResult.isOk()).toBe(true);

    const result = await useCase.execute({
      cardId: card.cardId.getStringValue(),
      curatorId: curatorId.value,
      visibility: 'PRIVATE',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('public collection');
    }
    const unchanged = (await cardRepository.findById(card.cardId)).unwrap()!;
    expect(unchanged.isPublic).toBe(true);
  });

  it('converts a private card to public', async () => {
    const card = await savedCard('https://example.com/priv', true);
    const oldRecord = card.getLibraryInfo(curatorId)!.publishedRecordId!;

    const result = await useCase.execute({
      cardId: card.cardId.getStringValue(),
      curatorId: curatorId.value,
      visibility: 'PUBLIC',
    });
    expect(result.isOk()).toBe(true);

    const updated = (await cardRepository.findById(card.cardId)).unwrap()!;
    expect(updated.isPublic).toBe(true);

    const unpublished = cardPublisher
      .getUnpublishedCards()
      .find((r) => r.uri === oldRecord.uri);
    expect(unpublished).toBeDefined();
    expect(unpublished!.isPrivate).toBe(true);

    const newRecord = updated.getLibraryInfo(curatorId)!.publishedRecordId!;
    expect(cardPublisher.getPublishTarget(newRecord.uri, newRecord.cid)).toBe(
      'repo',
    );
  });

  it('is a no-op when the visibility already matches', async () => {
    const card = await savedCard('https://example.com/noop');
    const before = card.getLibraryInfo(curatorId)!.publishedRecordId!;

    const result = await useCase.execute({
      cardId: card.cardId.getStringValue(),
      curatorId: curatorId.value,
      visibility: 'PUBLIC',
    });
    expect(result.isOk()).toBe(true);

    const after = (await cardRepository.findById(card.cardId)).unwrap()!;
    expect(after.getLibraryInfo(curatorId)!.publishedRecordId!.uri).toBe(
      before.uri,
    );
    expect(cardPublisher.getUnpublishedCards()).toHaveLength(0);
  });

  it('rejects non-owners', async () => {
    const card = await savedCard('https://example.com/owned');
    const result = await useCase.execute({
      cardId: card.cardId.getStringValue(),
      curatorId: 'did:plc:someoneelse',
      visibility: 'PRIVATE',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('owner');
    }
  });

  it('allows public→private when the card is only in private collections', async () => {
    const card = await savedCard('https://example.com/private-collection');
    const privateCollection = new CollectionBuilder()
      .withAuthorId(curatorId.value)
      .withName('Private Collection')
      .withAccessType('CLOSED')
      .withVisibility(Visibility.PRIVATE)
      .withPublishedRecordId({
        uri: 'at://did:plc:testcurator/space/network.cosmik.collectionSpace/3abc/network.cosmik.collection/self',
        cid: 'fake-space-collection-cid',
      })
      .build();
    if (privateCollection instanceof Error) throw privateCollection;
    await collectionRepository.save(privateCollection);
    const addResult = await cardCollectionService.addCardToCollection(
      card,
      privateCollection.collectionId,
      curatorId,
    );
    expect(addResult.isOk()).toBe(true);

    const result = await useCase.execute({
      cardId: card.cardId.getStringValue(),
      curatorId: curatorId.value,
      visibility: 'PRIVATE',
    });
    expect(result.isOk()).toBe(true);
    const updated = (await cardRepository.findById(card.cardId)).unwrap()!;
    expect(updated.isPrivate).toBe(true);
  });
});
