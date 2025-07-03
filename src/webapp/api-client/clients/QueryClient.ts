import { BaseClient } from './BaseClient';
import {
  GetUrlMetadataResponse,
  GetMyUrlCardsResponse,
  GetUrlCardViewResponse,
  GetLibrariesForCardResponse,
  GetMyProfileResponse,
  GetCollectionPageResponse,
  GetMyUrlCardsParams,
  GetCollectionPageParams,
} from '../types';

export class QueryClient extends BaseClient {
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
}
