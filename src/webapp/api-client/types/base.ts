// Base unified types for consistent API responses

export interface User {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  description?: string;
}

export interface UrlCard {
  id: string;
  type: 'URL';
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
  createdAt: string;
  updatedAt: string;
  note?: {
    id: string;
    text: string;
  };
  collections?: Collection[];
  libraries?: User[];
}

export interface Collection {
  id: string;
  uri?: string;
  name: string;
  description?: string;
  cardCount?: number;
  createdAt?: string;
  updatedAt?: string;
  author?: User;
  authorId?: string; // For backward compatibility
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
  nextCursor?: string;
}

export interface SortingMeta<T extends string = string> {
  sortBy: T;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T, S extends string = string> {
  data: T[];
  pagination: PaginationMeta;
  sorting: SortingMeta<S>;
}

// Specific sorting type aliases
export type CardSortingMeta = SortingMeta<'createdAt' | 'updatedAt' | 'libraryCount'>;
export type CollectionSortingMeta = SortingMeta<'name' | 'createdAt' | 'updatedAt' | 'cardCount'>;
