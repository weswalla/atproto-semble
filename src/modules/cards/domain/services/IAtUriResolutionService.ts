import { Result } from 'src/shared/core/Result';
import { CollectionId } from '../value-objects/CollectionId';

export enum AtUriResourceType {
  COLLECTION = 'collection',
}

export interface AtUriResolutionResult {
  type: AtUriResourceType;
  id: CollectionId;
}

export interface IAtUriResolutionService {
  resolveAtUri(atUri: string): Promise<Result<AtUriResolutionResult | null>>;

  // Convenience methods for specific types
  resolveCollectionId(atUri: string): Promise<Result<CollectionId | null>>;
}
