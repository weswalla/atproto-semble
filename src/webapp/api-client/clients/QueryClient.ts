import { BaseClient } from './BaseClient';
import {
  GetUrlMetadataResponse,
  GetMyUrlCardsResponse,
  GetUrlCardViewResponse,
  GetLibrariesForCardResponse,
  GetMyProfileResponse,
  GetCollectionPageResponse,
  GetMyCollectionsResponse,
  GetMyUrlCardsParams,
  GetCollectionPageParams,
  GetMyCollectionsParams,
} from '../types';

export class QueryClient extends BaseClient {
  async getUrlMetadata(url: string): Promise<GetUrlMetadataResponse> {
    const params = new URLSearchParams({ url });
    return this.request<GetUrlMetadataResponse>(
      'GET',
      `/api/cards/metadata?${params}`,
    );
  }

  async getMyUrlCards(
    params?: GetMyUrlCardsParams,
  ): Promise<GetMyUrlCardsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/cards/my?${queryString}`
      : '/api/cards/my';

    return this.request<GetMyUrlCardsResponse>('GET', endpoint);
  }

  async getUrlCardView(cardId: string): Promise<GetUrlCardViewResponse> {
    return this.request<GetUrlCardViewResponse>('GET', `/api/cards/${cardId}`);
  }

  async getLibrariesForCard(
    cardId: string,
  ): Promise<GetLibrariesForCardResponse> {
    return this.request<GetLibrariesForCardResponse>(
      'GET',
      `/api/cards/${cardId}/libraries`,
    );
  }

  async getMyProfile(): Promise<GetMyProfileResponse> {
    return this.request<GetMyProfileResponse>('GET', '/api/users/me');
  }

  async getCollectionPage(
    collectionId: string,
    params?: GetCollectionPageParams,
  ): Promise<GetCollectionPageResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/collections/${collectionId}?${queryString}`
      : `/api/collections/${collectionId}`;

    return this.request<GetCollectionPageResponse>('GET', endpoint);
  }

  async getMyCollections(
    params?: GetMyCollectionsParams,
  ): Promise<GetMyCollectionsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/collections?${queryString}`
      : '/api/collections';

    return this.request<GetMyCollectionsResponse>('GET', endpoint);
  }
}
