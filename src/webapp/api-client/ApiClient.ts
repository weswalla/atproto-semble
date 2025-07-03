import { QueryClient, CardClient, CollectionClient } from './clients';
import type {
  // Request types
  AddUrlToLibraryRequest,
  AddCardToLibraryRequest,
  AddCardToCollectionRequest,
  UpdateNoteCardRequest,
  RemoveCardFromLibraryRequest,
  RemoveCardFromCollectionRequest,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  DeleteCollectionRequest,
  GetMyUrlCardsParams,
  GetCollectionPageParams,
  // Response types
  AddUrlToLibraryResponse,
  AddCardToLibraryResponse,
  AddCardToCollectionResponse,
  UpdateNoteCardResponse,
  RemoveCardFromLibraryResponse,
  RemoveCardFromCollectionResponse,
  CreateCollectionResponse,
  UpdateCollectionResponse,
  DeleteCollectionResponse,
  GetUrlMetadataResponse,
  GetMyUrlCardsResponse,
  GetUrlCardViewResponse,
  GetLibrariesForCardResponse,
  GetMyProfileResponse,
  GetCollectionPageResponse,
} from './types';

// Main API Client class using composition
export class ApiClient {
  private queryClient: QueryClient;
  private cardClient: CardClient;
  private collectionClient: CollectionClient;

  constructor(
    private baseUrl: string,
    private getAuthToken: () => string | null
  ) {
    this.queryClient = new QueryClient(baseUrl, getAuthToken);
    this.cardClient = new CardClient(baseUrl, getAuthToken);
    this.collectionClient = new CollectionClient(baseUrl, getAuthToken);
  }

  // Query operations - delegate to QueryClient
  async getUrlMetadata(url: string): Promise<GetUrlMetadataResponse> {
    return this.queryClient.getUrlMetadata(url);
  }

  async getMyUrlCards(params?: GetMyUrlCardsParams): Promise<GetMyUrlCardsResponse> {
    return this.queryClient.getMyUrlCards(params);
  }

  async getUrlCardView(cardId: string): Promise<GetUrlCardViewResponse> {
    return this.queryClient.getUrlCardView(cardId);
  }

  async getLibrariesForCard(cardId: string): Promise<GetLibrariesForCardResponse> {
    return this.queryClient.getLibrariesForCard(cardId);
  }

  async getMyProfile(): Promise<GetMyProfileResponse> {
    return this.queryClient.getMyProfile();
  }

  async getCollectionPage(collectionId: string, params?: GetCollectionPageParams): Promise<GetCollectionPageResponse> {
    return this.queryClient.getCollectionPage(collectionId, params);
  }

  // Card operations - delegate to CardClient
  async addUrlToLibrary(request: AddUrlToLibraryRequest): Promise<AddUrlToLibraryResponse> {
    return this.cardClient.addUrlToLibrary(request);
  }

  async addCardToLibrary(request: AddCardToLibraryRequest): Promise<AddCardToLibraryResponse> {
    return this.cardClient.addCardToLibrary(request);
  }

  async addCardToCollection(request: AddCardToCollectionRequest): Promise<AddCardToCollectionResponse> {
    return this.cardClient.addCardToCollection(request);
  }

  async updateNoteCard(request: UpdateNoteCardRequest): Promise<UpdateNoteCardResponse> {
    return this.cardClient.updateNoteCard(request);
  }

  async removeCardFromLibrary(request: RemoveCardFromLibraryRequest): Promise<RemoveCardFromLibraryResponse> {
    return this.cardClient.removeCardFromLibrary(request);
  }

  async removeCardFromCollection(request: RemoveCardFromCollectionRequest): Promise<RemoveCardFromCollectionResponse> {
    return this.cardClient.removeCardFromCollection(request);
  }

  // Collection operations - delegate to CollectionClient
  async createCollection(request: CreateCollectionRequest): Promise<CreateCollectionResponse> {
    return this.collectionClient.createCollection(request);
  }

  async updateCollection(request: UpdateCollectionRequest): Promise<UpdateCollectionResponse> {
    return this.collectionClient.updateCollection(request);
  }

  async deleteCollection(request: DeleteCollectionRequest): Promise<DeleteCollectionResponse> {
    return this.collectionClient.deleteCollection(request);
  }
}

// Re-export types for convenience
export * from './types';
