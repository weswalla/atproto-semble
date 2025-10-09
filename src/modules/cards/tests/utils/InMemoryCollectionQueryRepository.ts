import {
  ICollectionQueryRepository,
  CollectionQueryOptions,
  CollectionQueryResultDTO,
  CollectionContainingCardDTO,
  PaginatedQueryResult,
  CollectionSortField,
  SortOrder,
} from '../../domain/ICollectionQueryRepository';
import { Collection } from '../../domain/Collection';
import { InMemoryCollectionRepository } from './InMemoryCollectionRepository';

export class InMemoryCollectionQueryRepository
  implements ICollectionQueryRepository
{
  constructor(private collectionRepository: InMemoryCollectionRepository) {}

  async findByCreator(
    curatorId: string,
    options: CollectionQueryOptions,
  ): Promise<PaginatedQueryResult<CollectionQueryResultDTO>> {
    try {
      // Get all collections and filter by creator
      const allCollections = this.collectionRepository.getAllCollections();
      let creatorCollections = allCollections.filter(
        (collection) => collection.authorId.value === curatorId,
      );

      // Apply text search if provided
      if (options.searchText && options.searchText.trim()) {
        const searchTerm = options.searchText.trim().toLowerCase();
        creatorCollections = creatorCollections.filter((collection) => {
          const nameMatch = collection.name.value
            .toLowerCase()
            .includes(searchTerm);
          const descriptionMatch =
            collection.description?.value.toLowerCase().includes(searchTerm) ||
            false;
          return nameMatch || descriptionMatch;
        });
      }

      // Sort collections
      const sortedCollections = this.sortCollections(
        creatorCollections,
        options.sortBy,
        options.sortOrder,
      );

      // Apply pagination
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedCollections = sortedCollections.slice(
        startIndex,
        endIndex,
      );

      // Transform to DTOs
      const items: CollectionQueryResultDTO[] = paginatedCollections.map(
        (collection) => {
          const collectionPublishedRecordId = collection.publishedRecordId;
          return {
            id: collection.collectionId.getStringValue(),
            uri: collectionPublishedRecordId?.uri,
            authorId: collection.authorId.value,
            name: collection.name.value,
            description: collection.description?.value,
            accessType: collection.accessType,
            cardCount: collection.cardCount,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
          };
        },
      );

      return {
        items,
        totalCount: creatorCollections.length,
        hasMore: endIndex < creatorCollections.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to query collections: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private sortCollections(
    collections: Collection[],
    sortBy: CollectionSortField,
    sortOrder: SortOrder,
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

  async getCollectionsContainingCardForUser(
    cardId: string,
    curatorId: string,
  ): Promise<CollectionContainingCardDTO[]> {
    try {
      // Get all collections and filter by creator
      const allCollections = this.collectionRepository.getAllCollections();
      const creatorCollections = allCollections.filter(
        (collection) => collection.authorId.value === curatorId,
      );

      // Filter collections that contain the specified card
      const collectionsWithCard = creatorCollections.filter((collection) =>
        collection.cardLinks.some(
          (link) => link.cardId.getStringValue() === cardId,
        ),
      );

      // Transform to DTOs
      const result: CollectionContainingCardDTO[] = collectionsWithCard.map(
        (collection) => {
          const collectionPublishedRecordId = collection.publishedRecordId;
          return {
            id: collection.collectionId.getStringValue(),
            uri: collectionPublishedRecordId?.uri,
            name: collection.name.value,
            description: collection.description?.value,
          };
        },
      );

      return result;
    } catch (error) {
      throw new Error(
        `Failed to get collections containing card: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  clear(): void {
    // No separate state to clear
  }
}
