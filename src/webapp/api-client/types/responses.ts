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

export interface GetProfileResponse extends UserProfile {}

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

export interface GetUrlCardsResponse {
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
  uri?: string;
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

export interface GetCollectionsResponse {
  collections: {
    id: string;
    uri?: string;
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
  }[];
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

export interface GenerateExtensionTokensResponse {
  accessToken: string;
  refreshToken: string;
}

// Feed response types
export interface FeedActivityActor {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
}

export interface FeedActivityCard {
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

export interface FeedItem {
  id: string;
  user: FeedActivityActor;
  card: FeedActivityCard;
  createdAt: Date;
  collections: {
    id: string;
    name: string;
    authorHandle: string;
    uri?: string;
  }[];
}

export interface GetGlobalFeedResponse {
  activities: FeedItem[];
  pagination: {
    currentPage: number;
    totalCount: number;
    hasMore: boolean;
    limit: number;
    nextCursor?: string;
  };
}
