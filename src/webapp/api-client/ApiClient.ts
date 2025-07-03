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

// Response types
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
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  imageUrl?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
  libraryCount: number;
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
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  imageUrl?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
  libraryCount: number;
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
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface GetMyUrlCardsResponse {
  cards: UrlCardListItem[];
  pagination: Pagination;
  sorting: Sorting;
}

export interface CollectionPageUrlCard {
  id: string;
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  imageUrl?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
  libraryCount: number;
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

// Error types
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Query parameters
export interface GetMyUrlCardsParams {
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

// Main API Client class
export class ApiClient {
  constructor(
    private baseUrl: string,
    private getAuthToken: () => string | null
  ) {}

  // Query operations
  async getUrlMetadata(url: string): Promise<GetUrlMetadataResponse> {
    const params = new URLSearchParams({ url });
    return this.request<GetUrlMetadataResponse>('GET', `/cards/metadata?${params}`);
  }

  async getMyUrlCards(params?: GetMyUrlCardsParams): Promise<GetMyUrlCardsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/cards/my?${queryString}` : '/cards/my';
    
    return this.request<GetMyUrlCardsResponse>('GET', endpoint);
  }

  async getUrlCardView(cardId: string): Promise<GetUrlCardViewResponse> {
    return this.request<GetUrlCardViewResponse>('GET', `/cards/${cardId}`);
  }

  async getLibrariesForCard(cardId: string): Promise<GetLibrariesForCardResponse> {
    return this.request<GetLibrariesForCardResponse>('GET', `/cards/${cardId}/libraries`);
  }

  async getMyProfile(): Promise<GetMyProfileResponse> {
    return this.request<GetMyProfileResponse>('GET', '/users/me');
  }

  async getCollectionPage(collectionId: string, params?: GetCollectionPageParams): Promise<GetCollectionPageResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/collections/${collectionId}?${queryString}` : `/collections/${collectionId}`;
    
    return this.request<GetCollectionPageResponse>('GET', endpoint);
  }

  // Card operations
  async addUrlToLibrary(request: AddUrlToLibraryRequest): Promise<AddUrlToLibraryResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async addCardToLibrary(request: AddCardToLibraryRequest): Promise<AddCardToLibraryResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async addCardToCollection(request: AddCardToCollectionRequest): Promise<AddCardToCollectionResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async updateNoteCard(request: UpdateNoteCardRequest): Promise<UpdateNoteCardResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async removeCardFromLibrary(request: RemoveCardFromLibraryRequest): Promise<RemoveCardFromLibraryResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async removeCardFromCollection(request: RemoveCardFromCollectionRequest): Promise<RemoveCardFromCollectionResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  // Collection operations
  async createCollection(request: CreateCollectionRequest): Promise<CreateCollectionResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async updateCollection(request: UpdateCollectionRequest): Promise<UpdateCollectionResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  async deleteCollection(request: DeleteCollectionRequest): Promise<DeleteCollectionResponse> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  // Private helper methods
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const token = this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config: RequestInit = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, config);
    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: ApiErrorResponse;
      
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          message: response.statusText || 'Unknown error',
        };
      }
      
      throw new ApiError(
        errorData.message,
        response.status,
        errorData.code,
        errorData.details
      );
    }
    
    return response.json();
  }
}
