// Unified base DTOs for consistent API responses across the application
// These types should match the frontend types in src/webapp/api-client/types/base.ts

import { CardTypeEnum } from '../../../modules/cards/domain/value-objects/CardType';

/**
 * Unified user representation for all API responses
 */
export interface UserDTO {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  description?: string;
}

/**
 * Unified URL card representation for all API responses
 * Note: type is always 'URL' in the current system
 */
export interface UrlCardDTO {
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
  collections?: CollectionDTO[];
  libraries?: UserDTO[];
}

/**
 * Unified collection representation for all API responses
 */
export interface CollectionDTO {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  cardCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  author?: UserDTO;
  authorId?: string; // For backward compatibility
}

/**
 * Unified pagination metadata for all paginated responses
 */
export interface PaginationMetaDTO {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
  nextCursor?: string;
}

/**
 * Generic sorting metadata
 */
export interface SortingMetaDTO<T extends string = string> {
  sortBy: T;
  sortOrder: 'asc' | 'desc';
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponseDTO<T, S extends string = string> {
  data: T[];
  pagination: PaginationMetaDTO;
  sorting: SortingMetaDTO<S>;
}

/**
 * Card sorting field types
 */
export type CardSortField = 'createdAt' | 'updatedAt' | 'libraryCount';

/**
 * Collection sorting field types
 */
export type CollectionSortField = 'name' | 'createdAt' | 'updatedAt' | 'cardCount';

/**
 * Specific sorting type for cards
 */
export type CardSortingMetaDTO = SortingMetaDTO<CardSortField>;

/**
 * Specific sorting type for collections
 */
export type CollectionSortingMetaDTO = SortingMetaDTO<CollectionSortField>;
