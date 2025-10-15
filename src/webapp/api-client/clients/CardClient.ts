import { BaseClient } from './BaseClient';
import {
  AddUrlToLibraryRequest,
  AddUrlToLibraryResponse,
  AddCardToLibraryRequest,
  AddCardToLibraryResponse,
  AddCardToCollectionRequest,
  AddCardToCollectionResponse,
  UpdateNoteCardRequest,
  UpdateNoteCardResponse,
  UpdateUrlCardAssociationsRequest,
  UpdateUrlCardAssociationsResponse,
  RemoveCardFromLibraryRequest,
  RemoveCardFromLibraryResponse,
  RemoveCardFromCollectionRequest,
  RemoveCardFromCollectionResponse,
} from '../types';

export class CardClient extends BaseClient {
  async addUrlToLibrary(
    request: AddUrlToLibraryRequest,
  ): Promise<AddUrlToLibraryResponse> {
    return this.request<AddUrlToLibraryResponse>(
      'POST',
      '/api/cards/library/urls',
      request,
    );
  }

  async addCardToLibrary(
    request: AddCardToLibraryRequest,
  ): Promise<AddCardToLibraryResponse> {
    return this.request<AddCardToLibraryResponse>(
      'POST',
      '/api/cards/library',
      request,
    );
  }

  async addCardToCollection(
    request: AddCardToCollectionRequest,
  ): Promise<AddCardToCollectionResponse> {
    return this.request<AddCardToCollectionResponse>(
      'POST',
      '/api/cards/collections',
      request,
    );
  }

  async updateNoteCard(
    request: UpdateNoteCardRequest,
  ): Promise<UpdateNoteCardResponse> {
    return this.request<UpdateNoteCardResponse>(
      'PUT',
      `/api/cards/${request.cardId}/note`,
      {
        note: request.note,
      },
    );
  }

  async updateUrlCardAssociations(
    request: UpdateUrlCardAssociationsRequest,
  ): Promise<UpdateUrlCardAssociationsResponse> {
    return this.request<UpdateUrlCardAssociationsResponse>(
      'PUT',
      '/api/cards/url/associations',
      request,
    );
  }

  async removeCardFromLibrary(
    request: RemoveCardFromLibraryRequest,
  ): Promise<RemoveCardFromLibraryResponse> {
    return this.request<RemoveCardFromLibraryResponse>(
      'DELETE',
      `/api/cards/${request.cardId}/library`,
    );
  }

  async removeCardFromCollection(
    request: RemoveCardFromCollectionRequest,
  ): Promise<RemoveCardFromCollectionResponse> {
    const collectionIdsParam = request.collectionIds.join(',');
    return this.request<RemoveCardFromCollectionResponse>(
      'DELETE',
      `/api/cards/${request.cardId}/collections?collectionIds=${encodeURIComponent(collectionIdsParam)}`,
    );
  }
}
