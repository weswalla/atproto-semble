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
  existingCardId?: string;
}

export interface UrlCardView {
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
  createdAt: string;
  updatedAt: string;
  note?: {
    id: string;
    text: string;
  };
  collections: {
    id: string;
    name: string;
    authorId: string;
  }[];
  libraries: {
    userId: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  }[];
}

export interface GetUrlCardViewResponse extends UrlCardView {}

export interface LibraryUser {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}

export interface GetLibrariesForCardResponse {
  cardId: string;
  users: LibraryUser[];
  totalCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  description?: string;
  avatarUrl?: string;
}

export interface GetMyProfileResponse extends UserProfile {}

export interface UrlCardListItem {
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
  createdAt: string;
  updatedAt: string;
  note?: {
    id: string;
    text: string;
  };
  collections: {
    id: string;
    name: string;
    authorId: string;
  }[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
}

export interface Sorting {
  sortBy: 'createdAt' | 'updatedAt' | 'libraryCount';
  sortOrder: 'asc' | 'desc';
}

export interface GetMyUrlCardsResponse {
  cards: UrlCardListItem[];
  pagination: Pagination;
  sorting: Sorting;
}

export interface CollectionPageUrlCard {
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
  createdAt: string;
  updatedAt: string;
  note?: {
    id: string;
    text: string;
  };
}

export interface GetCollectionPageResponse {
  id: string;
  name: string;
  description?: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
  urlCards: CollectionPageUrlCard[];
  pagination: Pagination;
  sorting: Sorting;
}

export interface GetMyCollectionsResponse {
  collections: Array<{
    id: string;
    name: string;
    description?: string;
    cardCount: number;
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: string;
      name: string;
      handle: string;
      avatarUrl?: string;
    };
  }>;
  pagination: Pagination;
  sorting: {
    sortBy: 'name' | 'createdAt' | 'updatedAt' | 'cardCount';
    sortOrder: 'asc' | 'desc';
  };
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

// Request types
export interface AddUrlToLibraryRequest {
  url: string;
  note?: string;
}

export interface AddCardToLibraryRequest {
  cardId: string;
}

export interface AddCardToCollectionRequest {
  cardId: string;
  collectionIds: string[];
}

export interface UpdateNoteCardRequest {
  cardId: string;
  text: string;
}

export interface RemoveCardFromLibraryRequest {
  cardId: string;
}

export interface RemoveCardFromCollectionRequest {
  cardId: string;
  collectionId: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface UpdateCollectionRequest {
  collectionId: string;
  name?: string;
  description?: string;
}

export interface DeleteCollectionRequest {
  collectionId: string;
}

export interface LoginWithAppPasswordRequest {
  handle: string;
  appPassword: string;
}

export interface InitiateOAuthSignInRequest {
  redirectUri?: string;
}

export interface CompleteOAuthSignInRequest {
  code: string;
  state: string;
  iss: string;
}

export interface RefreshAccessTokenRequest {
  refreshToken: string;
}

// Query parameter types
export interface GetMyUrlCardsParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'libraryCount';
  sortOrder?: 'asc' | 'desc';
}

export interface GetCollectionPageParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'libraryCount';
  sortOrder?: 'asc' | 'desc';
}

export interface GetMyCollectionsParams {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'cardCount';
  sortOrder?: 'asc' | 'desc';
}
