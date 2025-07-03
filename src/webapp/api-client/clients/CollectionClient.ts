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
    return this.request<CreateCollectionResponse>('POST', '/collections', request);
  }

  async updateCollection(request: UpdateCollectionRequest): Promise<UpdateCollectionResponse> {
    const { collectionId, ...updateData } = request;
    return this.request<UpdateCollectionResponse>('PUT', `/collections/${collectionId}`, updateData);
  }

  async deleteCollection(request: DeleteCollectionRequest): Promise<DeleteCollectionResponse> {
    return this.request<DeleteCollectionResponse>('DELETE', `/collections/${request.collectionId}`);
  }
}
