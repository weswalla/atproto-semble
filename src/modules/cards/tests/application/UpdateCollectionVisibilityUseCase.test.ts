import { UpdateCollectionVisibilityUseCase } from '../../application/useCases/commands/UpdateCollectionVisibilityUseCase';
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
import { Collection, CollectionAccessType } from '../../domain/Collection';
import { Card } from '../../domain/Card';
import { Visibility } from '../../domain/value-objects/Visibility';

describe('UpdateCollectionVisibilityUseCase', () => {
  let useCase: UpdateCollectionVisibilityUseCase;
  let addUrlToLibraryUseCase: AddUrlToLibraryUseCase;
  let cardRepository: InMemoryCardRepository;
  let collectionRepository: InMemoryCollectionRepository;
  let cardPublisher: FakeCardPublisher;
  let collectionPublisher: FakeCollectionPublisher;
  let metadataService: FakeMetadataService;
  let cardLibraryService: CardLibraryService;
  let cardCollectionService: CardCollectionService;
  let eventPublisher: FakeEventPublisher;
  let author: CuratorId;

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

    useCase = new UpdateCollectionVisibilityUseCase(
      collectionRepository,
      cardRepository,
      collectionPublisher,
      eventPublisher,
    );

    addUrlToLibraryUseCase = new AddUrlToLibraryUseCase(
      cardRepository,
      metadataService,
      cardLibraryService,
      cardCollectionService,
      eventPublisher,
    );

    author = CuratorId.create('did:plc:author').unwrap();
  });

  afterEach(() => {
    cardRepository.clear();
    collectionRepository.clear();
    cardPublisher.clear();
    collectionPublisher.clear();
    metadataService.clear();
    eventPublisher.clear();
  });

  async function savedCard(url: string, isPrivate = false): Promise<Card> {
    const result = await addUrlToLibraryUseCase.execute({
      url,
      curatorId: author.value,
      isPrivate,
    });
    expect(result.isOk()).toBe(true);
    return (
      await cardRepository.findById(
        CardId.createFromString(result.unwrap().urlCardId).unwrap(),
      )
    ).unwrap()!;
  }

  /** A published public collection with `urls.length` author-added cards. */
  async function publicCollectionWithCards(
    urls: string[],
  ): Promise<Collection> {
    const built = new CollectionBuilder()
      .withAuthorId(author.value)
      .withName('Test Collection')
      .withAccessType('CLOSED')
      .build();
    if (built instanceof Error) throw built;
    await collectionRepository.save(built);

    // Publish the collection record and store it
    const publishResult = await collectionPublisher.publish(built);
    expect(publishResult.isOk()).toBe(true);
    built.markAsPublished(publishResult.unwrap());
    await collectionRepository.updateMetadata(built.collectionId, {
      publishedRecordId: publishResult.unwrap(),
    });

    for (const url of urls) {
      const card = await savedCard(url);
      const addResult = await cardCollectionService.addCardToCollection(
        card,
        built.collectionId,
        author,
      );
      expect(addResult.isOk()).toBe(true);
    }
    return (
      await collectionRepository.findById(built.collectionId)
    ).unwrap()!;
  }

  async function makePrivate(collection: Collection): Promise<Collection> {
    const result = await useCase.execute({
      collectionId: collection.collectionId.getStringValue(),
      curatorId: author.value,
      visibility: 'PRIVATE',
    });
    expect(result.isOk()).toBe(true);
    return (
      await collectionRepository.findById(collection.collectionId)
    ).unwrap()!;
  }

  it('public→private: unpublishes the public record, publishes into a new space, migrates links', async () => {
    const collection = await publicCollectionWithCards([
      'https://example.com/a',
      'https://example.com/b',
    ]);
    const oldUri = collection.publishedRecordId!.uri;
    const collectionId = collection.collectionId.getStringValue();

    const result = await useCase.execute({
      collectionId,
      curatorId: author.value,
      visibility: 'PRIVATE',
    });
    expect(result.isOk()).toBe(true);

    const updated = (
      await collectionRepository.findById(collection.collectionId)
    ).unwrap()!;
    expect(updated.isPrivateCollection).toBe(true);
    expect(updated.spaceUri).toBeDefined();
    expect(updated.publishedRecordId!.uri).toContain('/space/');

    // old public collection record unpublished
    expect(
      collectionPublisher
        .getUnpublishedCollections()
        .find((record) => record.uri === oldUri),
    ).toBeDefined();

    // both membership records republished into the space
    expect(
      collectionPublisher.getPublishedSpaceCardsForCollection(collectionId),
    ).toHaveLength(2);

    // every card link points at a record inside the space
    expect(updated.cardLinks).toHaveLength(2);
    for (const link of updated.cardLinks) {
      expect(link.publishedRecordId!.uri).toContain('/space/');
    }

    // the old public collectionLink records were removed
    expect(collectionPublisher.getAllRemovedLinks()).toHaveLength(2);
  });

  it('public→private: refused when a contributor added a card', async () => {
    const collection = await publicCollectionWithCards(['https://example.com/a']);
    // A card added by someone else
    const contributor = CuratorId.create('did:plc:contributor').unwrap();
    const stored = (
      await collectionRepository.findById(collection.collectionId)
    ).unwrap()!;
    const contributorCard = await savedCard('https://example.com/other');
    // OPEN would be needed for a stranger; add directly on the aggregate to
    // simulate an existing contributor-added link.
    stored.props.accessType = CollectionAccessType.OPEN;
    stored.addCard(contributorCard.cardId, contributor).unwrap();
    stored.props.accessType = CollectionAccessType.CLOSED;
    await collectionRepository.save(stored);

    const result = await useCase.execute({
      collectionId: collection.collectionId.getStringValue(),
      curatorId: author.value,
      visibility: 'PRIVATE',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('contributor');
    }
  });

  it('public→private: refused for OPEN collections', async () => {
    const built = new CollectionBuilder()
      .withAuthorId(author.value)
      .withName('Open Collection')
      .withAccessType('OPEN')
      .build();
    if (built instanceof Error) throw built;
    await collectionRepository.save(built);

    const result = await useCase.execute({
      collectionId: built.collectionId.getStringValue(),
      curatorId: author.value,
      visibility: 'PRIVATE',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('open');
    }
  });

  it('private→public: republishes publicly, republishes links, deletes the space', async () => {
    const collection = await makePrivate(
      await publicCollectionWithCards([
        'https://example.com/a',
        'https://example.com/b',
      ]),
    );
    const spaceUri = collection.spaceUri!;

    const result = await useCase.execute({
      collectionId: collection.collectionId.getStringValue(),
      curatorId: author.value,
      visibility: 'PUBLIC',
    });
    expect(result.isOk()).toBe(true);

    const updated = (
      await collectionRepository.findById(collection.collectionId)
    ).unwrap()!;
    expect(updated.isPublicCollection).toBe(true);
    expect(updated.spaceUri).toBeUndefined();
    expect(updated.publishedRecordId!.uri).not.toContain('/space/');
    expect(collectionPublisher.getDeletedSpaces()).toContain(spaceUri);

    // links now point at public collectionLink records
    expect(updated.cardLinks).toHaveLength(2);
    for (const link of updated.cardLinks) {
      expect(link.publishedRecordId!.uri).not.toContain('/space/');
    }
  });

  it('private→public: refused while the collection contains private cards', async () => {
    const collection = await makePrivate(
      await publicCollectionWithCards(['https://example.com/a']),
    );
    const privateCard = await savedCard('https://example.com/secret', true);
    const addResult = await cardCollectionService.addCardToCollection(
      privateCard,
      collection.collectionId,
      author,
    );
    expect(addResult.isOk()).toBe(true);

    const result = await useCase.execute({
      collectionId: collection.collectionId.getStringValue(),
      curatorId: author.value,
      visibility: 'PUBLIC',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('private card');
    }
  });

  it('is a no-op when the visibility already matches', async () => {
    const collection = await publicCollectionWithCards([]);
    const result = await useCase.execute({
      collectionId: collection.collectionId.getStringValue(),
      curatorId: author.value,
      visibility: 'PUBLIC',
    });
    expect(result.isOk()).toBe(true);
    expect(collectionPublisher.getUnpublishedCollections()).toHaveLength(0);
  });

  it('only the author can convert', async () => {
    const collection = await publicCollectionWithCards([]);
    const result = await useCase.execute({
      collectionId: collection.collectionId.getStringValue(),
      curatorId: 'did:plc:notauthor',
      visibility: 'PRIVATE',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('author');
    }
  });
});
