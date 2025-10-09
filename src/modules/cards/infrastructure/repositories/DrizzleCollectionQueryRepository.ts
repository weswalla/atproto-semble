import { eq, desc, asc, count, sql, or, ilike, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  ICollectionQueryRepository,
  CollectionQueryOptions,
  PaginatedQueryResult,
  CollectionQueryResultDTO,
  CollectionSortField,
  SortOrder,
  CollectionContainingCardDTO,
} from '../../domain/ICollectionQueryRepository';
import { collections, collectionCards } from './schema/collection.sql';
import { publishedRecords } from './schema/publishedRecord.sql';
import { CollectionMapper } from './mappers/CollectionMapper';

export class DrizzleCollectionQueryRepository
  implements ICollectionQueryRepository
{
  constructor(private db: PostgresJsDatabase) {}

  async findByCreator(
    curatorId: string,
    options: CollectionQueryOptions,
  ): Promise<PaginatedQueryResult<CollectionQueryResultDTO>> {
    try {
      const { page, limit, sortBy, sortOrder, searchText } = options;
      const offset = (page - 1) * limit;

      // Build the sort order
      const orderDirection = sortOrder === SortOrder.ASC ? asc : desc;

      // Build where conditions
      const whereConditions = [eq(collections.authorId, curatorId)];

      // Add search condition if searchText is provided
      if (searchText && searchText.trim()) {
        const searchTerm = `%${searchText.trim()}%`;
        whereConditions.push(
          or(
            ilike(collections.name, searchTerm),
            ilike(collections.description, searchTerm),
          )!,
        );
      }

      // Simple query: get collections with their stored card counts and URIs
      const collectionsQuery = this.db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          createdAt: collections.createdAt,
          updatedAt: collections.updatedAt,
          authorId: collections.authorId,
          cardCount: collections.cardCount,
          uri: publishedRecords.uri,
        })
        .from(collections)
        .leftJoin(
          publishedRecords,
          eq(collections.publishedRecordId, publishedRecords.id),
        )
        .where(
          sql`${whereConditions.reduce((acc, condition, index) =>
            index === 0 ? condition : sql`${acc} AND ${condition}`,
          )}`,
        )
        .orderBy(orderDirection(this.getSortColumn(sortBy)))
        .limit(limit)
        .offset(offset);

      const collectionsResult = await collectionsQuery;

      // Get total count with same search conditions
      const totalCountResult = await this.db
        .select({ count: count() })
        .from(collections)
        .where(
          sql`${whereConditions.reduce((acc, condition, index) =>
            index === 0 ? condition : sql`${acc} AND ${condition}`,
          )}`,
        );

      const totalCount = totalCountResult[0]?.count || 0;
      const hasMore = offset + collectionsResult.length < totalCount;

      // Map to DTOs
      const items = collectionsResult.map((raw) =>
        CollectionMapper.toQueryResult({
          id: raw.id,
          uri: raw.uri,
          name: raw.name,
          description: raw.description,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
          authorId: raw.authorId,
          cardCount: raw.cardCount,
        }),
      );

      return {
        items,
        totalCount,
        hasMore,
      };
    } catch (error) {
      console.error('Error in findByCreator:', error);
      throw error;
    }
  }

  async getCollectionsContainingCardForUser(
    cardId: string,
    curatorId: string,
  ): Promise<CollectionContainingCardDTO[]> {
    try {
      // Find collections authored by this curator that contain this card
      const collectionResults = await this.db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          uri: publishedRecords.uri,
        })
        .from(collections)
        .leftJoin(
          publishedRecords,
          eq(collections.publishedRecordId, publishedRecords.id),
        )
        .innerJoin(
          collectionCards,
          eq(collections.id, collectionCards.collectionId),
        )
        .where(
          and(
            eq(collections.authorId, curatorId),
            eq(collectionCards.cardId, cardId),
          ),
        )
        .orderBy(asc(collections.name));

      return collectionResults.map((result) => ({
        id: result.id,
        uri: result.uri || undefined,
        name: result.name,
        description: result.description || undefined,
      }));
    } catch (error) {
      console.error('Error in getCollectionsContainingCardForUser:', error);
      throw error;
    }
  }

  private getSortColumn(sortBy: CollectionSortField) {
    switch (sortBy) {
      case CollectionSortField.NAME:
        return collections.name;
      case CollectionSortField.CREATED_AT:
        return collections.createdAt;
      case CollectionSortField.UPDATED_AT:
        return collections.updatedAt;
      case CollectionSortField.CARD_COUNT:
        return collections.cardCount;
      default:
        return collections.updatedAt;
    }
  }
}
