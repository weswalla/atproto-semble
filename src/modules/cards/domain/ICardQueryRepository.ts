import { CardTypeEnum } from "./value-objects/CardType";

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

// Raw data from repository - minimal, just what's stored
export type UrlCardQueryResultDTO = CollectionCardQueryResultDTO & {
  collections: {
    id: string;
    name: string;
    authorId: string;
  }[];
};

// DTO for single URL card view with library and collection info
export interface UrlCardViewDTO {
  id: string;
  type: CardTypeEnum.NOTE;
  urlMeta: {
    title?: string;
    description?: string;
    url: string;
    author?: string;
    thumbnailUrl?: string;
  };
  inLibraries: {
    userId: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  }[];
  inCollections: {
    id: string;
    name: string;
    authorId: string;
  }[];
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

  getUrlCardView(cardId: string): Promise<UrlCardViewDTO | null>;
}
