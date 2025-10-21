// Unified User/Profile interface - used across all endpoints
export interface User {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  description?: string;
}

// Base pagination interface
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
}

// Extended pagination with cursor for feeds
export interface FeedPagination extends Pagination {
  nextCursor?: string;
}

// Base sorting interface
export interface BaseSorting {
  sortOrder: 'asc' | 'desc';
}

// Specific sorting interfaces
export interface CardSorting extends BaseSorting {
  sortBy: 'createdAt' | 'updatedAt' | 'libraryCount';
}

export interface CollectionSorting extends BaseSorting {
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'cardCount';
}
