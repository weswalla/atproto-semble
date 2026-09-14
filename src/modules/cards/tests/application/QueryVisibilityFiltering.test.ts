import { InMemoryCardRepository } from '../utils/InMemoryCardRepository';
import { InMemoryCollectionRepository } from '../utils/InMemoryCollectionRepository';
import { InMemoryCardQueryRepository } from '../utils/InMemoryCardQueryRepository';
import { InMemoryCollectionQueryRepository } from '../utils/InMemoryCollectionQueryRepository';
import { InMemoryConnectionRepository } from '../utils/InMemoryConnectionRepository';
import { InMemoryConnectionQueryRepository } from '../utils/InMemoryConnectionQueryRepository';
import { CardFactory } from '../../domain/CardFactory';
import { CardTypeEnum } from '../../domain/value-objects/CardType';
import { UrlMetadata } from '../../domain/value-objects/UrlMetadata';
import { Visibility } from '../../domain/value-objects/Visibility';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { Connection } from '../../domain/Connection';
import {
  UrlOrCardId,
  UrlOrCardIdType,
} from '../../domain/value-objects/UrlOrCardId';
import { CollectionBuilder } from '../utils/builders/CollectionBuilder';
import {
  CardSortField,
  SortOrder,
  CardQueryOptions,
} from '../../domain/ICardQueryRepository';
import {
  CollectionSortField,
  SortOrder as CollectionSortOrder,
} from '../../domain/ICollectionQueryRepository';
import {
  ConnectionSortField,
  SortOrder as ConnectionSortOrder,
} from '../../domain/IConnectionQueryRepository';

const OWNER = 'did:plc:privacyowner';
const OTHER = 'did:plc:otherviewer';
const PRIVATE_URL = 'https://example.com/private-only';

const cardOptions: CardQueryOptions = {
  page: 1,
  limit: 20,
  sortBy: CardSortField.CREATED_AT,
  sortOrder: SortOrder.DESC,
};

/**
 * Behavioral contract of the visibility predicate across the in-memory query
 * repositories (mirrors of the SQL implementations): rows are visible when
 * PUBLIC or owned by the caller.
 */
describe('Query visibility filtering', () => {
  let cardRepo: InMemoryCardRepository;
  let collectionRepo: InMemoryCollectionRepository;
  let cardQueryRepo: InMemoryCardQueryRepository;
  let collectionQueryRepo: InMemoryCollectionQueryRepository;
  let connectionRepo: InMemoryConnectionRepository;
  let connectionQueryRepo: InMemoryConnectionQueryRepository;
  const owner = CuratorId.create(OWNER).unwrap();

  beforeEach(() => {
    cardRepo = InMemoryCardRepository.getInstance();
    collectionRepo = InMemoryCollectionRepository.getInstance();
    cardRepo.clear();
    collectionRepo.clear();
    cardQueryRepo = new InMemoryCardQueryRepository(cardRepo, collectionRepo);
    collectionQueryRepo = new InMemoryCollectionQueryRepository(
      collectionRepo,
      cardRepo,
    );
    connectionRepo = InMemoryConnectionRepository.getInstance();
    connectionRepo.clear();
    connectionQueryRepo = new InMemoryConnectionQueryRepository(connectionRepo);
  });

  async function savePrivateCard(url = PRIVATE_URL) {
    const card = CardFactory.create({
      curatorId: OWNER,
      cardInput: {
        type: CardTypeEnum.URL,
        url,
        metadata: UrlMetadata.create({ url, title: 'Secret Title' }).unwrap(),
      },
      visibility: Visibility.PRIVATE,
    }).unwrap();
    card.addToLibrary(owner).unwrap();
    await cardRepo.save(card);
    return card;
  }

  describe('cards', () => {
    it('getUrlCardsOfUser hides private cards from other viewers but shows them to the owner', async () => {
      await savePrivateCard();

      const forOther = await cardQueryRepo.getUrlCardsOfUser(
        OWNER,
        cardOptions,
        OTHER,
      );
      expect(forOther.items).toHaveLength(0);
      expect(forOther.totalCount).toBe(0);

      const forOwner = await cardQueryRepo.getUrlCardsOfUser(
        OWNER,
        cardOptions,
        OWNER,
      );
      expect(forOwner.items).toHaveLength(1);
      expect(forOwner.items[0]!.visibility).toBe(Visibility.PRIVATE);
    });

    it('getLibrariesForUrl anonymizes private saves behind privateLibraryCount', async () => {
      await savePrivateCard();

      const forOther = await cardQueryRepo.getLibrariesForUrl(
        PRIVATE_URL,
        cardOptions,
        OTHER,
      );
      expect(forOther.items).toHaveLength(0);
      expect(forOther.privateLibraryCount).toBe(1);

      const forOwner = await cardQueryRepo.getLibrariesForUrl(
        PRIVATE_URL,
        cardOptions,
        OWNER,
      );
      expect(forOwner.items).toHaveLength(1);
      expect(forOwner.privateLibraryCount).toBe(0);
    });

    it('getBatchUrlCardViews omits private cards for non-authors (feed hydration seam)', async () => {
      const card = await savePrivateCard();
      const cardId = card.cardId.getStringValue();

      const forOther = await cardQueryRepo.getBatchUrlCardViews(
        [cardId],
        OTHER,
      );
      expect(forOther.has(cardId)).toBe(false);

      const forOwner = await cardQueryRepo.getBatchUrlCardViews(
        [cardId],
        OWNER,
      );
      expect(forOwner.has(cardId)).toBe(true);
    });

    it('searchUrls excludes URLs that only exist through private cards', async () => {
      await savePrivateCard();

      const forOther = await cardQueryRepo.searchUrls({
        searchQuery: 'Secret',
        page: 1,
        limit: 20,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
        callingUserId: OTHER,
      });
      expect(forOther.items).toHaveLength(0);

      const forOwner = await cardQueryRepo.searchUrls({
        searchQuery: 'Secret',
        page: 1,
        limit: 20,
        sortBy: CardSortField.UPDATED_AT,
        sortOrder: SortOrder.DESC,
        callingUserId: OWNER,
      });
      expect(forOwner.items).toHaveLength(1);
    });

    it('getBatchUrlLibraryInfo flags visibleCardExists per caller', async () => {
      await savePrivateCard();

      const forOther = await cardQueryRepo.getBatchUrlLibraryInfo(
        [PRIVATE_URL],
        OTHER,
      );
      expect(forOther.get(PRIVATE_URL)?.visibleCardExists).toBe(false);

      const forOwner = await cardQueryRepo.getBatchUrlLibraryInfo(
        [PRIVATE_URL],
        OWNER,
      );
      expect(forOwner.get(PRIVATE_URL)?.visibleCardExists).toBe(true);
    });
  });

  describe('collections', () => {
    async function savePrivateCollection() {
      const built = new CollectionBuilder()
        .withAuthorId(OWNER)
        .withName('Secret Collection')
        .withAccessType('CLOSED')
        .withVisibility(Visibility.PRIVATE)
        .build();
      if (built instanceof Error) throw built;
      await collectionRepo.save(built);
      return built;
    }

    it('findByCreator hides private collections unless viewing your own', async () => {
      await savePrivateCollection();

      const options = {
        page: 1,
        limit: 20,
        sortBy: CollectionSortField.UPDATED_AT,
        sortOrder: CollectionSortOrder.DESC,
      };

      const forOther = await collectionQueryRepo.findByCreator(
        OWNER,
        options,
        OTHER,
      );
      expect(forOther.items).toHaveLength(0);

      const forOwner = await collectionQueryRepo.findByCreator(
        OWNER,
        options,
        OWNER,
      );
      expect(forOwner.items).toHaveLength(1);
      expect(forOwner.items[0]!.visibility).toBe(Visibility.PRIVATE);
    });

    it('getCollectionsWithUrl hides private collections from other viewers', async () => {
      const url = 'https://example.com/public-card';
      const card = CardFactory.create({
        curatorId: OWNER,
        cardInput: {
          type: CardTypeEnum.URL,
          url,
          metadata: UrlMetadata.create({ url }).unwrap(),
        },
      }).unwrap();
      card.addToLibrary(owner).unwrap();
      await cardRepo.save(card);

      const collection = await savePrivateCollection();
      collection.addCard(card.cardId, owner).unwrap();
      await collectionRepo.save(collection);

      const options = {
        page: 1,
        limit: 20,
        sortBy: CollectionSortField.UPDATED_AT,
        sortOrder: CollectionSortOrder.DESC,
      };

      const forOther = await collectionQueryRepo.getCollectionsWithUrl(
        url,
        options,
        OTHER,
      );
      expect(forOther.items).toHaveLength(0);

      const forOwner = await collectionQueryRepo.getCollectionsWithUrl(
        url,
        options,
        OWNER,
      );
      expect(forOwner.items).toHaveLength(1);
    });
  });

  describe('connections', () => {
    async function savePrivateConnection() {
      const connection = Connection.create({
        source: UrlOrCardId.reconstruct(
          UrlOrCardIdType.URL,
          'https://example.com/a',
        ).unwrap(),
        target: UrlOrCardId.reconstruct(
          UrlOrCardIdType.URL,
          'https://example.com/b',
        ).unwrap(),
        curatorId: owner,
        visibility: Visibility.PRIVATE,
      }).unwrap();
      await connectionRepo.save(connection);
      return connection;
    }

    const options = {
      page: 1,
      limit: 20,
      sortBy: ConnectionSortField.CREATED_AT,
      sortOrder: ConnectionSortOrder.DESC,
    };

    it('getConnectionsForUser hides private connections unless viewing your own', async () => {
      await savePrivateConnection();

      const forOther = await connectionQueryRepo.getConnectionsForUser(
        OWNER,
        options,
        OTHER,
      );
      expect(forOther.items).toHaveLength(0);
      expect(forOther.totalCount).toBe(0);

      const forOwner = await connectionQueryRepo.getConnectionsForUser(
        OWNER,
        options,
        OWNER,
      );
      expect(forOwner.items).toHaveLength(1);
      expect(forOwner.items[0]!.connection.visibility).toBe(
        Visibility.PRIVATE,
      );
    });

    it('getConnectionsForUrl hides private connections from other viewers', async () => {
      await savePrivateConnection();

      const forOther = await connectionQueryRepo.getConnectionsForUrl(
        'https://example.com/a',
        'both',
        options,
        OTHER,
      );
      expect(forOther.items).toHaveLength(0);

      const forOwner = await connectionQueryRepo.getConnectionsForUrl(
        'https://example.com/a',
        'both',
        options,
        OWNER,
      );
      expect(forOwner.items).toHaveLength(1);
    });
  });
});
