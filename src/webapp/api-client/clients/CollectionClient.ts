import { BaseClient } from './BaseClient';
import {
  CreateCollectionRequest,
  CreateCollectionResponse,
  UpdateCollectionRequest,
  UpdateCollectionResponse,
  DeleteCollectionRequest,
  DeleteCollectionResponse,
} from '../types';

export class CollectionClient extends BaseClient {
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
}
