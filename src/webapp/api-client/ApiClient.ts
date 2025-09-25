import {
  QueryClient,
  CardClient,
  CollectionClient,
  UserClient,
  FeedClient,
} from './clients';
import { TokenManager } from '../services/TokenManager';
import {
  createClientTokenManager,
  createServerTokenManager,
} from '../services/auth';
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
  LoginWithAppPasswordRequest,
  InitiateOAuthSignInRequest,
  CompleteOAuthSignInRequest,
  RefreshAccessTokenRequest,
  GenerateExtensionTokensRequest,
  GetMyUrlCardsParams,
  GetCollectionPageParams,
  GetMyCollectionsParams,
  GetGlobalFeedParams,
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
  LoginWithAppPasswordResponse,
  InitiateOAuthSignInResponse,
  CompleteOAuthSignInResponse,
  RefreshAccessTokenResponse,
  GenerateExtensionTokensResponse,
  GetUrlMetadataResponse,
  GetUrlCardViewResponse,
  GetLibrariesForCardResponse,
  GetCollectionPageResponse,
  GetGlobalFeedResponse,
  GetCollectionsResponse,
  GetCollectionsParams,
  GetUrlCardsParams,
  GetUrlCardsResponse,
  GetProfileResponse,
  GetProfileParams,
} from './types';

// Main API Client class using composition
export class ApiClient {
  private queryClient: QueryClient;
  private cardClient: CardClient;
  private collectionClient: CollectionClient;
  private userClient: UserClient;
  private feedClient: FeedClient;

  constructor(
    private baseUrl: string,
    private tokenManager?: TokenManager,
  ) {
    this.queryClient = new QueryClient(baseUrl, tokenManager);
    this.cardClient = new CardClient(baseUrl, tokenManager);
    this.collectionClient = new CollectionClient(baseUrl, tokenManager);
    this.userClient = new UserClient(baseUrl, tokenManager);
    this.feedClient = new FeedClient(baseUrl, tokenManager);
  }

  // Helper to check if client is authenticated
  get isAuthenticated(): boolean {
    return !!this.tokenManager;
  }

  // Helper method to ensure authentication for protected operations
  private requireAuthentication(operation: string): void {
    if (!this.tokenManager) {
      throw new Error(`Authentication required for ${operation}`);
    }
  }

  // Query operations - delegate to QueryClient
  async getUrlMetadata(url: string): Promise<GetUrlMetadataResponse> {
    return this.queryClient.getUrlMetadata(url);
  }

  async getMyUrlCards(
    params?: GetMyUrlCardsParams,
  ): Promise<GetUrlCardsResponse> {
    this.requireAuthentication('getMyUrlCards');
    return this.queryClient.getMyUrlCards(params);
  }

  async getUrlCards(params: GetUrlCardsParams): Promise<GetUrlCardsResponse> {
    return this.queryClient.getUserUrlCards(params);
  }

  async getUrlCardView(cardId: string): Promise<GetUrlCardViewResponse> {
    return this.queryClient.getUrlCardView(cardId);
  }

  async getLibrariesForCard(
    cardId: string,
  ): Promise<GetLibrariesForCardResponse> {
    this.requireAuthentication('getLibrariesForCard');
    return this.queryClient.getLibrariesForCard(cardId);
  }

  async getMyProfile(): Promise<GetProfileResponse> {
    this.requireAuthentication('getMyProfile');
    return this.queryClient.getMyProfile();
  }

  async getProfile(params: GetProfileParams): Promise<GetProfileResponse> {
    return this.queryClient.getUserProfile(params);
  }

  async getCollectionPage(
    collectionId: string,
    params?: GetCollectionPageParams,
  ): Promise<GetCollectionPageResponse> {
    return this.queryClient.getCollectionPage(collectionId, params);
  }

  async getMyCollections(
    params?: GetMyCollectionsParams,
  ): Promise<GetCollectionsResponse> {
    this.requireAuthentication('getMyCollections');
    return this.queryClient.getMyCollections(params);
  }

  async getCollections(
    params: GetCollectionsParams,
  ): Promise<GetCollectionsResponse> {
    return this.queryClient.getUserCollections(params);
  }

  // Card operations - delegate to CardClient (all require authentication)
  async addUrlToLibrary(
    request: AddUrlToLibraryRequest,
  ): Promise<AddUrlToLibraryResponse> {
    this.requireAuthentication('addUrlToLibrary');
    return this.cardClient.addUrlToLibrary(request);
  }

  async addCardToLibrary(
    request: AddCardToLibraryRequest,
  ): Promise<AddCardToLibraryResponse> {
    this.requireAuthentication('addCardToLibrary');
    return this.cardClient.addCardToLibrary(request);
  }

  async addCardToCollection(
    request: AddCardToCollectionRequest,
  ): Promise<AddCardToCollectionResponse> {
    this.requireAuthentication('addCardToCollection');
    return this.cardClient.addCardToCollection(request);
  }

  async updateNoteCard(
    request: UpdateNoteCardRequest,
  ): Promise<UpdateNoteCardResponse> {
    this.requireAuthentication('updateNoteCard');
    return this.cardClient.updateNoteCard(request);
  }

  async removeCardFromLibrary(
    request: RemoveCardFromLibraryRequest,
  ): Promise<RemoveCardFromLibraryResponse> {
    this.requireAuthentication('removeCardFromLibrary');
    return this.cardClient.removeCardFromLibrary(request);
  }

  async removeCardFromCollection(
    request: RemoveCardFromCollectionRequest,
  ): Promise<RemoveCardFromCollectionResponse> {
    this.requireAuthentication('removeCardFromCollection');
    return this.cardClient.removeCardFromCollection(request);
  }

  // Collection operations - delegate to CollectionClient (all require authentication)
  async createCollection(
    request: CreateCollectionRequest,
  ): Promise<CreateCollectionResponse> {
    this.requireAuthentication('createCollection');
    return this.collectionClient.createCollection(request);
  }

  async updateCollection(
    request: UpdateCollectionRequest,
  ): Promise<UpdateCollectionResponse> {
    this.requireAuthentication('updateCollection');
    return this.collectionClient.updateCollection(request);
  }

  async deleteCollection(
    request: DeleteCollectionRequest,
  ): Promise<DeleteCollectionResponse> {
    this.requireAuthentication('deleteCollection');
    return this.collectionClient.deleteCollection(request);
  }

  // User operations - delegate to UserClient
  async loginWithAppPassword(
    request: LoginWithAppPasswordRequest,
  ): Promise<LoginWithAppPasswordResponse> {
    return this.userClient.loginWithAppPassword(request);
  }

  async initiateOAuthSignIn(
    request?: InitiateOAuthSignInRequest,
  ): Promise<InitiateOAuthSignInResponse> {
    return this.userClient.initiateOAuthSignIn(request);
  }

  async completeOAuthSignIn(
    request: CompleteOAuthSignInRequest,
  ): Promise<CompleteOAuthSignInResponse> {
    return this.userClient.completeOAuthSignIn(request);
  }

  async refreshAccessToken(
    request: RefreshAccessTokenRequest,
  ): Promise<RefreshAccessTokenResponse> {
    this.requireAuthentication('refreshAccessToken');
    return this.userClient.refreshAccessToken(request);
  }

  async generateExtensionTokens(
    request?: GenerateExtensionTokensRequest,
  ): Promise<GenerateExtensionTokensResponse> {
    this.requireAuthentication('generateExtensionTokens');
    return this.userClient.generateExtensionTokens(request);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    this.requireAuthentication('logout');
    return this.userClient.logout();
  }

  // Feed operations - delegate to FeedClient
  async getGlobalFeed(
    params?: GetGlobalFeedParams,
  ): Promise<GetGlobalFeedResponse> {
    return this.feedClient.getGlobalFeed(params);
  }
}

// Re-export types for convenience
export * from './types';

// Factory functions for different client types
export const createAuthenticatedApiClient = () => {
  return new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    createClientTokenManager(),
  );
};

export const createUnauthenticatedApiClient = () => {
  return new ApiClient(
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    undefined,
  );
};

// Factory function for server-side API client
export const createServerApiClient = async () => {
  const tokenManager = await createServerTokenManager();
  return new ApiClient(
    process.env.API_BASE_URL || 'http://localhost:3000',
    tokenManager,
  );
};

// Default authenticated client instance for client-side usage (backward compatibility)
export const apiClient = createAuthenticatedApiClient();

// Default unauthenticated client instance for public operations
export const publicApiClient = createUnauthenticatedApiClient();
