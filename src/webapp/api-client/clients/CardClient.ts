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
}
