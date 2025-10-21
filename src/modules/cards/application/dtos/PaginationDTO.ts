// Unified Pagination DTO - matches ApiClient Pagination interface
export interface PaginationDTO {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
}

// Extended pagination with cursor for feeds
export interface FeedPaginationDTO extends PaginationDTO {
  nextCursor?: string;
}
