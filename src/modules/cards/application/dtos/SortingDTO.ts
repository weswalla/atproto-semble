import { CardSortField, SortOrder } from '../../domain/ICardQueryRepository';
import { CollectionSortField } from '../../domain/ICollectionQueryRepository';

// Base sorting DTO
export interface BaseSortingDTO {
  sortOrder: SortOrder;
}

// Card sorting DTO - matches ApiClient CardSorting interface
export interface CardSortingDTO extends BaseSortingDTO {
  sortBy: CardSortField;
}

// Collection sorting DTO - matches ApiClient CollectionSorting interface
export interface CollectionSortingDTO extends BaseSortingDTO {
  sortBy: CollectionSortField;
}
