import { Result, ok, err } from "../../../../shared/core/Result";
import {
  ICollectionQueryRepository,
  CollectionQueryOptions,
  CollectionQueryResultDTO,
  PaginatedQueryResult,
  CollectionSortField,
  SortOrder,
} from "../../domain/ICollectionQueryRepository";
import { Collection } from "../../domain/Collection";

export class InMemoryCollectionQueryRepository
  implements ICollectionQueryRepository
{
  private collections: Map<string, Collection> = new Map();

  async findByCreator(
    curatorId: string,
    options: CollectionQueryOptions
  ): Promise<PaginatedQueryResult<CollectionQueryResultDTO>> {
    try {
      // Filter collections by creator
      const creatorCollections = Array.from(this.collections.values()).filter(
        (collection) => collection.authorId.value === curatorId
      );

      // Sort collections
      const sortedCollections = this.sortCollections(
        creatorCollections,
        options.sortBy,
        options.sortOrder
      );

      // Apply pagination
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedCollections = sortedCollections.slice(
        startIndex,
        endIndex
      );

      // Transform to DTOs
      const items: CollectionQueryResultDTO[] = paginatedCollections.map(
        (collection) => ({
          id: collection.collectionId.getStringValue(),
          authorId: collection.authorId.value,
          name: collection.name.value,
          description: collection.description?.value,
          accessType: collection.accessType,
          cardCount: collection.cardCount,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        })
      );

      return {
        items,
        totalCount: creatorCollections.length,
        hasMore: endIndex < creatorCollections.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to query collections: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private sortCollections(
    collections: Collection[],
    sortBy: CollectionSortField,
    sortOrder: SortOrder
  ): Collection[] {
    const sorted = [...collections].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case CollectionSortField.NAME:
          comparison = a.name.value.localeCompare(b.name.value);
          break;
        case CollectionSortField.CREATED_AT:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case CollectionSortField.UPDATED_AT:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case CollectionSortField.CARD_COUNT:
          comparison = a.cardCount - b.cardCount;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === SortOrder.DESC ? -comparison : comparison;
    });

    return sorted;
  }

  // Test helper methods
  addCollection(collection: Collection): void {
    this.collections.set(collection.collectionId.getStringValue(), collection);
  }

  clear(): void {
    this.collections.clear();
  }

  getStoredCollection(id: string): Collection | undefined {
    return this.collections.get(id);
  }

  getAllCollections(): Collection[] {
    return Array.from(this.collections.values());
  }
}
