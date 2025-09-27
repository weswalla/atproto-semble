import { Result } from 'src/shared/core/Result';
import { CollectionId } from '../value-objects/CollectionId';
import { CardId } from '../value-objects/CardId';

export enum AtUriResourceType {
  COLLECTION = 'collection',
  CARD = 'card',
}

export interface AtUriResolutionResult {
  type: AtUriResourceType;
  id: CollectionId | CardId;
}

export interface IAtUriResolutionService {
  resolveAtUri(atUri: string): Promise<Result<AtUriResolutionResult | null>>;
  
  // Convenience methods for specific types
  resolveCollectionId(atUri: string): Promise<Result<CollectionId | null>>;
  resolveCardId(atUri: string): Promise<Result<CardId | null>>;
}
