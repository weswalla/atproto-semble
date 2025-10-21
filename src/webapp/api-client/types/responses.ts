import {
  User,
  UrlCard,
  Collection,
  PaginationMeta,
  SortingMeta,
  PaginatedResponse,
  CardSortingMeta,
  CollectionSortingMeta,
} from './base';

// Command response types
export interface AddUrlToLibraryResponse {
  urlCardId: string;
  noteCardId?: string;
}

export interface AddCardToLibraryResponse {
  cardId: string;
}

export interface AddCardToCollectionResponse {
  cardId: string;
}

export interface UpdateNoteCardResponse {
  cardId: string;
}

export interface UpdateUrlCardAssociationsResponse {
  urlCardId: string;
  noteCardId?: string;
  addedToCollections: string[];
  removedFromCollections: string[];
}

export interface RemoveCardFromLibraryResponse {
  cardId: string;
}

export interface RemoveCardFromCollectionResponse {
  cardId: string;
}

export interface CreateCollectionResponse {
  collectionId: string;
}

export interface UpdateCollectionResponse {
  collectionId: string;
}

export interface DeleteCollectionResponse {
  collectionId: string;
}

// Query response types
export interface UrlMetadata {
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  imageUrl?: string;
  type?: string;
}

export interface GetUrlMetadataResponse {
  metadata: UrlMetadata;
}

// Use base UrlCard type directly
export type GetUrlCardViewResponse = UrlCard;

export interface GetLibrariesForCardResponse {
  cardId: string;
  users: User[];
  totalCount: number;
}

// Use base User type directly
export type GetProfileResponse = User;

export interface GetUrlCardsResponse {
  cards: UrlCard[];
  pagination: PaginationMeta;
  sorting: CardSortingMeta;
}

// Special case: extends Collection with additional fields
export interface GetCollectionPageResponse extends Collection {
  urlCards: UrlCard[];
  pagination: PaginationMeta;
  sorting: CardSortingMeta;
}

export interface GetCollectionsResponse {
  collections: Collection[];
  pagination: PaginationMeta;
  sorting: CollectionSortingMeta;
}

// User authentication response types
export interface LoginWithAppPasswordResponse {
  accessToken: string;
  refreshToken: string;
}

export interface InitiateOAuthSignInResponse {
  authUrl: string;
}

export interface CompleteOAuthSignInResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshAccessTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface GenerateExtensionTokensResponse {
  accessToken: string;
  refreshToken: string;
}

// Feed response types using unified base types
export interface FeedItem {
  id: string;
  user: User;
  card: UrlCard;
  createdAt: Date;
  collections: Collection[];
}

export interface GetGlobalFeedResponse {
  activities: FeedItem[];
  pagination: PaginationMeta;
}

export interface GetUrlStatusForMyLibraryResponse {
  cardId?: string;
  collections?: Collection[];
}

export interface GetLibrariesForUrlResponse {
  libraries: User[];
  pagination: PaginationMeta;
  sorting: CardSortingMeta;
}

export interface NoteCard {
  id: string;
  note: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface GetNoteCardsForUrlResponse {
  notes: NoteCard[];
  pagination: PaginationMeta;
  sorting: CardSortingMeta;
}

export interface GetCollectionsForUrlResponse {
  collections: Collection[];
  pagination: PaginationMeta;
  sorting: CollectionSortingMeta;
}
