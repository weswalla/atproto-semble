export interface CardQueryOptions {
  page: number;
  limit: number;
  sortBy: CardSortField;
  sortOrder: SortOrder;
}

export interface PaginatedQueryResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

export enum CardSortField {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  LIBRARY_COUNT = "libraryCount",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

// Raw data from repository - minimal, just what's stored
export interface UrlCardQueryResultDTO {
  id: string;
  url: string;
  urlMeta: {
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  createdAt: Date;
  updatedAt: Date;
  collections: {
    id: string;
    name: string;
    authorId: string;
  }[];
  note?: {
    id: string;
    text: string;
  };
}

// Simplified DTO for cards in a collection (no collections array to avoid circular data)
export interface CollectionCardQueryResultDTO {
  id: string;
  url: string;
  urlMeta: {
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  createdAt: Date;
  updatedAt: Date;
  note?: {
    id: string;
    text: string;
  };
}

export interface ICardQueryRepository {
  getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions
  ): Promise<PaginatedQueryResult<UrlCardQueryResultDTO>>;
  
  getCardsInCollection(
    collectionId: string,
    options: CardQueryOptions
  ): Promise<PaginatedQueryResult<CollectionCardQueryResultDTO>>;
}
