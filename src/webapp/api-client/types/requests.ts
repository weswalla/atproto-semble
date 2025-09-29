// Request types - cleaned up from backend DTOs
export interface AddUrlToLibraryRequest {
  url: string;
  note?: string;
  collectionIds?: string[];
}

export interface AddCardToLibraryRequest {
  cardId: string;
  collectionIds?: string[];
}

export interface AddCardToCollectionRequest {
  cardId: string;
  collectionIds: string[];
}

export interface UpdateNoteCardRequest {
  cardId: string;
  note: string;
}

export interface RemoveCardFromLibraryRequest {
  cardId: string;
}

export interface RemoveCardFromCollectionRequest {
  cardId: string;
  collectionIds: string[];
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
}

export interface UpdateCollectionRequest {
  collectionId: string;
  name: string;
  description?: string;
}

export interface DeleteCollectionRequest {
  collectionId: string;
}

// Query parameters
export interface GetMyUrlCardsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetUrlCardsParams {
  identifier: string; // Can be DID or handle
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetCollectionPageParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetMyCollectionsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchText?: string;
}

export interface GetCollectionsParams {
  identifier: string; // Can be DID or handle
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchText?: string;
}

export interface GetCollectionPageByAtUriParams {
  handle: string;
  recordKey: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Feed request types
export interface GetGlobalFeedParams {
  page?: number;
  limit?: number;
  beforeActivityId?: string; // For cursor-based pagination
}

// User authentication request types
export interface LoginWithAppPasswordRequest {
  identifier: string;
  appPassword: string;
}

export interface InitiateOAuthSignInRequest {
  handle?: string;
}

export interface CompleteOAuthSignInRequest {
  code: string;
  state: string;
  iss: string;
}

export interface RefreshAccessTokenRequest {
  refreshToken: string;
}

export interface GenerateExtensionTokensRequest {
  // No additional parameters needed - user is authenticated via middleware
}

export interface GetProfileParams {
  identifier: string; // Can be DID or handle
}
