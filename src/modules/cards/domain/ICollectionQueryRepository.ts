export interface CollectionQueryOptions {
  page: number;
  limit: number;
  sortBy: CollectionSortField;
  sortOrder: SortOrder;
  searchText?: string;
}

export interface PaginatedQueryResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

export enum CollectionSortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  CARD_COUNT = 'cardCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// Raw data from repository - minimal, just what's stored
export interface CollectionQueryResultDTO {
  id: string;
  uri: string;
  name: string;
  description?: string;
  updatedAt: Date;
  createdAt: Date;
  cardCount: number;
  authorId: string; // Just the curator ID, not enriched data
}

export interface ICollectionQueryRepository {
  findByCreator(
    curatorId: string,
    options: CollectionQueryOptions,
  ): Promise<PaginatedQueryResult<CollectionQueryResultDTO>>;
}
