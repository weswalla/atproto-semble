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

// Main API Client class
export class ApiClient {
  constructor(
    private baseUrl: string,
    private getAuthToken: () => string | null
  ) {}

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

  // Private helper methods (to be implemented)
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    // TODO: Implement HTTP request logic
    throw new Error('Not implemented');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // TODO: Implement response handling and error parsing
    throw new Error('Not implemented');
  }
}
