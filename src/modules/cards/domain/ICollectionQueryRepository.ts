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

export interface CollectionQueryResultDTO {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  updatedAt: Date;
  createdAt: Date;
  cardCount: number;
  authorId: string;
}

export interface CollectionContainingCardDTO {
  id: string;
  uri?: string;
  name: string;
  description?: string;
}

export interface CollectionForUrlDTO {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  authorId: string;
}

export interface CollectionForUrlQueryOptions {
  page: number;
  limit: number;
}

export interface ICollectionQueryRepository {
  findByCreator(
    curatorId: string,
    options: CollectionQueryOptions,
  ): Promise<PaginatedQueryResult<CollectionQueryResultDTO>>;

  getCollectionsContainingCardForUser(
    cardId: string,
    curatorId: string,
  ): Promise<CollectionContainingCardDTO[]>;

  getCollectionsWithUrl(
    url: string,
    options: CollectionForUrlQueryOptions,
  ): Promise<PaginatedQueryResult<CollectionForUrlDTO>>;
}
