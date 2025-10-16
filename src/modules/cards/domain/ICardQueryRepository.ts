import { CardTypeEnum } from './value-objects/CardType';

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
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LIBRARY_COUNT = 'libraryCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// Simplified DTO for cards in a collection (no collections array to avoid circular data)
export interface UrlCardView {
  id: string;
  type: CardTypeEnum.URL;
  url: string;
  cardContent: {
    url: string;
    title?: string;
    description?: string;
    author?: string;
    thumbnailUrl?: string;
  };
  libraryCount: number;
  urlLibraryCount: number;
  urlInLibrary?: boolean;
  createdAt: Date;
  updatedAt: Date;
  note?: {
    id: string;
    text: string;
  };
}

export type CollectionCardQueryResultDTO = UrlCardView;
// Raw data from repository - minimal, just what's stored
export interface WithCollections {
  collections: { id: string; name: string; authorId: string }[];
}

export interface WithLibraries {
  libraries: { userId: string }[];
}
export type UrlCardQueryResultDTO = UrlCardView & WithCollections;

// DTO for single URL card view with library and collection info
export type UrlCardViewDTO = UrlCardView & WithCollections & WithLibraries;

export interface LibraryForUrlDTO {
  userId: string;
  cardId: string;
}

export interface NoteCardForUrlDTO {
  id: string;
  note: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICardQueryRepository {
  getUrlCardsOfUser(
    userId: string,
    options: CardQueryOptions,
    callingUserId?: string,
  ): Promise<PaginatedQueryResult<UrlCardQueryResultDTO>>;

  getCardsInCollection(
    collectionId: string,
    options: CardQueryOptions,
    callingUserId?: string,
  ): Promise<PaginatedQueryResult<CollectionCardQueryResultDTO>>;

  getUrlCardView(
    cardId: string,
    callingUserId?: string,
  ): Promise<UrlCardViewDTO | null>;

  getLibrariesForCard(cardId: string): Promise<string[]>;

  getLibrariesForUrl(
    url: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<LibraryForUrlDTO>>;

  getNoteCardsForUrl(
    url: string,
    options: CardQueryOptions,
  ): Promise<PaginatedQueryResult<NoteCardForUrlDTO>>;
}
