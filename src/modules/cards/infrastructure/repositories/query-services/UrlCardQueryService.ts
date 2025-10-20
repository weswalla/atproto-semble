import { eq, desc, asc, count, countDistinct, inArray, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  CardQueryOptions,
  PaginatedQueryResult,
  UrlCardQueryResultDTO,
  UrlCardViewDTO,
  LibraryForUrlDTO,
  CardSortField,
  SortOrder,
} from '../../../domain/ICardQueryRepository';
import { cards } from '../schema/card.sql';
import { collections, collectionCards } from '../schema/collection.sql';
import { libraryMemberships } from '../schema/libraryMembership.sql';
import { CardMapper, RawUrlCardData } from '../mappers/CardMapper';
import { CardTypeEnum } from '../../../domain/value-objects/CardType';

export class UrlCardQueryService {
  constructor(private db: PostgresJsDatabase) {}

  async getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions,
    callingUserId?: string,
  ): Promise<PaginatedQueryResult<UrlCardQueryResultDTO>> {
    try {
      const { page, limit, sortBy, sortOrder } = options;
      const offset = (page - 1) * limit;

      // Build the sort order
      const orderDirection = sortOrder === SortOrder.ASC ? asc : desc;

      // First, get the URL cards for the user
      const urlCardsQuery = this.db
        .select({
          id: cards.id,
          url: cards.url,
          contentData: cards.contentData,
          libraryCount: cards.libraryCount,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        })
        .from(cards)
        .where(
          and(eq(cards.authorId, userId), eq(cards.type, CardTypeEnum.URL)),
        )
        .orderBy(orderDirection(this.getSortColumn(sortBy)))
        .limit(limit)
        .offset(offset);

      const urlCardsResult = await urlCardsQuery;

      if (urlCardsResult.length === 0) {
        return {
          items: [],
          totalCount: 0,
          hasMore: false,
        };
      }

      const cardIds = urlCardsResult.map((card) => card.id);
      const urls = urlCardsResult.map((card) => card.url || '');

      // Get collections for these cards
      const collectionsQuery = this.db
        .select({
          cardId: collectionCards.cardId,
          collectionId: collections.id,
          collectionName: collections.name,
          authorId: collections.authorId,
        })
        .from(collectionCards)
        .innerJoin(
          collections,
          eq(collectionCards.collectionId, collections.id),
        )
        .where(inArray(collectionCards.cardId, cardIds));

      const collectionsResult = await collectionsQuery;

      // Get note cards for these URL cards (same user, parentCardId matches, type = NOTE)
      const notesQuery = this.db
        .select({
          id: cards.id,
          parentCardId: cards.parentCardId,
          contentData: cards.contentData,
        })
        .from(cards)
        .where(
          and(
            eq(cards.authorId, userId),
            eq(cards.type, CardTypeEnum.NOTE),
            inArray(cards.parentCardId, cardIds),
          ),
        );

      const notesResult = await notesQuery;

      // Get urlLibraryCount for each URL (count of unique users who have cards with this URL)
      const urlLibraryCountsQuery = this.db
        .select({
          url: cards.url,
          count: countDistinct(libraryMemberships.userId),
        })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(and(eq(cards.type, CardTypeEnum.URL), inArray(cards.url, urls)))
        .groupBy(cards.url);

      const urlLibraryCountsResult = await urlLibraryCountsQuery;

      // Create a map of URL to urlLibraryCount
      const urlLibraryCountMap = new Map<string, number>();
      urlLibraryCountsResult.forEach((row) => {
        if (row.url) {
          urlLibraryCountMap.set(row.url, row.count);
        }
      });

      // Get urlInLibrary for each URL if callingUserId is provided
      let urlInLibraryMap: Map<string, boolean> | undefined;
      if (callingUserId) {
        const urlInLibraryQuery = this.db
          .select({
            url: cards.url,
          })
          .from(cards)
          .where(
            and(
              eq(cards.authorId, callingUserId),
              eq(cards.type, CardTypeEnum.URL),
              inArray(cards.url, urls),
            ),
          );

        const urlInLibraryResult = await urlInLibraryQuery;

        urlInLibraryMap = new Map<string, boolean>();
        // Initialize all URLs as false
        urls.forEach((url) => urlInLibraryMap!.set(url, false));
        // Set true for URLs the calling user has
        urlInLibraryResult.forEach((row) => {
          if (row.url) {
            urlInLibraryMap!.set(row.url, true);
          }
        });
      }

      // Get total count
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(cards)
        .where(
          and(eq(cards.authorId, userId), eq(cards.type, CardTypeEnum.URL)),
        );

      const totalCount = totalCountResult[0]?.count || 0;
      const hasMore = offset + urlCardsResult.length < totalCount;

      // Combine the data
      const rawCardData: RawUrlCardData[] = urlCardsResult.map((card) => {
        // Find collections for this card
        const cardCollections = collectionsResult
          .filter((c) => c.cardId === card.id)
          .map((c) => ({
            id: c.collectionId,
            name: c.collectionName,
            authorId: c.authorId,
          }));

        // Find note for this card
        const note = notesResult.find((n) => n.parentCardId === card.id);

        // Get urlLibraryCount from the map
        const urlLibraryCount = urlLibraryCountMap.get(card.url || '') || 0;

        // Get urlInLibrary from the map (undefined if callingUserId not provided)
        const urlInLibrary = urlInLibraryMap?.get(card.url || '');

        return {
          id: card.id,
          url: card.url || '',
          contentData: card.contentData,
          libraryCount: card.libraryCount,
          urlLibraryCount,
          urlInLibrary,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          collections: cardCollections,
          note: note
            ? {
                id: note.id,
                contentData: note.contentData,
              }
            : undefined,
        };
      });

      // Map to DTOs
      const items = rawCardData.map((raw) =>
        CardMapper.toUrlCardQueryResult(raw),
      );

      return {
        items,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error in getUrlCardsOfUser:', error);
      throw error;
    }
  }

  async getUrlCardView(
    cardId: string,
    callingUserId?: string,
  ): Promise<UrlCardViewDTO | null> {
    try {
      // Get the URL card
      const cardQuery = this.db
        .select({
          id: cards.id,
          type: cards.type,
          url: cards.url,
          contentData: cards.contentData,
          libraryCount: cards.libraryCount,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        })
        .from(cards)
        .where(and(eq(cards.id, cardId), eq(cards.type, CardTypeEnum.URL)));

      const cardResult = await cardQuery;

      if (cardResult.length === 0) {
        return null;
      }

      const card = cardResult[0]!;

      // Get users who have this card in their libraries
      const libraryQuery = this.db
        .select({
          userId: libraryMemberships.userId,
        })
        .from(libraryMemberships)
        .where(eq(libraryMemberships.cardId, cardId));

      const libraryResult = await libraryQuery;

      // Get collections that contain this card
      const collectionsQuery = this.db
        .select({
          collectionId: collections.id,
          collectionName: collections.name,
          authorId: collections.authorId,
        })
        .from(collectionCards)
        .innerJoin(
          collections,
          eq(collectionCards.collectionId, collections.id),
        )
        .where(eq(collectionCards.cardId, cardId));

      const collectionsResult = await collectionsQuery;

      // Get note card for this URL card (parentCardId matches, type = NOTE)
      const noteQuery = this.db
        .select({
          id: cards.id,
          parentCardId: cards.parentCardId,
          contentData: cards.contentData,
        })
        .from(cards)
        .where(
          and(
            eq(cards.type, CardTypeEnum.NOTE),
            eq(cards.parentCardId, cardId),
          ),
        );

      const noteResult = await noteQuery;
      const note = noteResult.length > 0 ? noteResult[0] : undefined;

      // Get urlLibraryCount for this URL
      const urlLibraryCountQuery = this.db
        .select({
          count: countDistinct(libraryMemberships.userId),
        })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(and(eq(cards.type, CardTypeEnum.URL), eq(cards.url, card.url)));

      const urlLibraryCountResult = await urlLibraryCountQuery;
      const urlLibraryCount = urlLibraryCountResult[0]?.count || 0;

      // Get urlInLibrary if callingUserId is provided
      let urlInLibrary: boolean | undefined;
      if (callingUserId) {
        // Check if the calling user has any card with this URL
        const urlInLibraryQuery = this.db
          .select({
            id: cards.id,
          })
          .from(cards)
          .where(
            and(
              eq(cards.authorId, callingUserId),
              eq(cards.type, CardTypeEnum.URL),
              eq(cards.url, card.url),
            ),
          )
          .limit(1);

        const urlInLibraryResult = await urlInLibraryQuery;
        urlInLibrary = urlInLibraryResult.length > 0;
      }

      // Map to DTO
      const urlCardView = CardMapper.toUrlCardViewDTO({
        id: card.id,
        type: card.type,
        url: card.url || '',
        contentData: card.contentData,
        libraryCount: card.libraryCount,
        urlLibraryCount,
        urlInLibrary,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
        inLibraries: libraryResult.map((lib) => ({ userId: lib.userId })),
        inCollections: collectionsResult.map((coll) => ({
          id: coll.collectionId,
          name: coll.collectionName,
          authorId: coll.authorId,
        })),
        note: note
          ? {
              id: note.id,
              contentData: note.contentData,
            }
          : undefined,
      });

      return urlCardView;
    } catch (error) {
      console.error('Error in getUrlCardView:', error);
      throw error;
    }
  }

  async getLibrariesForUrl(
    url: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<LibraryForUrlDTO>> {
    try {
      const { page, limit } = options;
      const offset = (page - 1) * limit;

      // Get all URL cards with this URL and their library memberships
      const librariesQuery = this.db
        .select({
          userId: libraryMemberships.userId,
          cardId: libraryMemberships.cardId,
          url: cards.url,
          contentData: cards.contentData,
          libraryCount: cards.libraryCount,
          createdAt: cards.createdAt,
          updatedAt: cards.updatedAt,
        })
        .from(libraryMemberships)
        .innerJoin(cards, eq(libraryMemberships.cardId, cards.id))
        .where(and(eq(cards.url, url), eq(cards.type, CardTypeEnum.URL)))
        .limit(limit)
        .offset(offset);

      const librariesResult = await librariesQuery;

      // Get total count first (before checking if results are empty)
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(libraryMemberships)
        .innerJoin(cards, eq(libraryMemberships.cardId, cards.id))
        .where(and(eq(cards.url, url), eq(cards.type, CardTypeEnum.URL)));

      const totalCount = totalCountResult[0]?.count || 0;
      const hasMore = offset + librariesResult.length < totalCount;

      if (librariesResult.length === 0) {
        return {
          items: [],
          totalCount,
          hasMore,
        };
      }

      const cardIds = librariesResult.map((lib) => lib.cardId);

      // Get notes for these cards
      const notesQuery = this.db
        .select({
          id: cards.id,
          parentCardId: cards.parentCardId,
          contentData: cards.contentData,
        })
        .from(cards)
        .where(
          and(
            eq(cards.type, CardTypeEnum.NOTE),
            inArray(cards.parentCardId, cardIds),
          ),
        );

      const notesResult = await notesQuery;

      // Get urlLibraryCount for this URL (total unique users who have cards with this URL)
      const urlLibraryCountQuery = this.db
        .select({
          count: countDistinct(libraryMemberships.userId),
        })
        .from(cards)
        .innerJoin(libraryMemberships, eq(cards.id, libraryMemberships.cardId))
        .where(and(eq(cards.type, CardTypeEnum.URL), eq(cards.url, url)));

      const urlLibraryCountResult = await urlLibraryCountQuery;
      const urlLibraryCount = urlLibraryCountResult[0]?.count || 0;

      // Map the results to include card data
      const items: LibraryForUrlDTO[] = librariesResult.map((lib) => {
        // Find note for this card
        const note = notesResult.find((n) => n.parentCardId === lib.cardId);

        const rawCardData = {
          id: lib.cardId,
          url: lib.url || '',
          contentData: lib.contentData,
          libraryCount: lib.libraryCount,
          urlLibraryCount,
          urlInLibrary: undefined,
          createdAt: lib.createdAt,
          updatedAt: lib.updatedAt,
          collections: [],
          note: note
            ? {
                id: note.id,
                contentData: note.contentData,
              }
            : undefined,
        };

        const cardView = CardMapper.toUrlCardQueryResult(rawCardData);

        return {
          userId: lib.userId,
          cardId: lib.cardId,
          card: cardView,
        };
      });

      return {
        items,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error in getLibrariesForUrl:', error);
      throw error;
    }
  }

  private getSortColumn(sortBy: CardSortField) {
    switch (sortBy) {
      case CardSortField.CREATED_AT:
        return cards.createdAt;
      case CardSortField.UPDATED_AT:
        return cards.updatedAt;
      case CardSortField.LIBRARY_COUNT:
        return cards.libraryCount;
      default:
        return cards.updatedAt;
    }
  }
}
