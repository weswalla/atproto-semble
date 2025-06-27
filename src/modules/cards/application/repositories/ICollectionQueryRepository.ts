import { CollectionListItemDTO } from "../useCases/queries/GetMyCollectionsUseCase";

export interface CollectionQueryOptions {
  page: number;
  limit: number;
  sortBy: CollectionSortField;
  sortOrder: SortOrder;
}

export interface PaginatedQueryResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

export enum CollectionSortField {
  NAME = "name",
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  CARD_COUNT = "cardCount",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export interface ICollectionQueryRepository {
  findByOwner(
    curatorId: string,
    options: CollectionQueryOptions
  ): Promise<PaginatedQueryResult<CollectionListItemDTO>>;
}
