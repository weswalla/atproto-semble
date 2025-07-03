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
  RemoveCardFromLibraryRequest,
  RemoveCardFromLibraryResponse,
  RemoveCardFromCollectionRequest,
  RemoveCardFromCollectionResponse,
} from '../types';

export class CardClient extends BaseClient {
  async addUrlToLibrary(request: AddUrlToLibraryRequest): Promise<AddUrlToLibraryResponse> {
    return this.request<AddUrlToLibraryResponse>('POST', '/cards/library/urls', request);
  }

  async addCardToLibrary(request: AddCardToLibraryRequest): Promise<AddCardToLibraryResponse> {
    return this.request<AddCardToLibraryResponse>('POST', '/cards/library', request);
  }

  async addCardToCollection(request: AddCardToCollectionRequest): Promise<AddCardToCollectionResponse> {
    return this.request<AddCardToCollectionResponse>('POST', '/cards/collections', request);
  }

  async updateNoteCard(request: UpdateNoteCardRequest): Promise<UpdateNoteCardResponse> {
    return this.request<UpdateNoteCardResponse>('PUT', `/cards/${request.cardId}/note`, {
      note: request.note
    });
  }

  async removeCardFromLibrary(request: RemoveCardFromLibraryRequest): Promise<RemoveCardFromLibraryResponse> {
    return this.request<RemoveCardFromLibraryResponse>('DELETE', `/cards/${request.cardId}/library`);
  }

  async removeCardFromCollection(request: RemoveCardFromCollectionRequest): Promise<RemoveCardFromCollectionResponse> {
    return this.request<RemoveCardFromCollectionResponse>('DELETE', `/cards/${request.cardId}/collections`, {
      collectionIds: request.collectionIds
    });
  }
}
