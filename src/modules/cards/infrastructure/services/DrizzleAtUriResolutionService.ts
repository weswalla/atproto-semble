import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { IAtUriResolutionService, AtUriResourceType, AtUriResolutionResult } from '../../domain/services/IAtUriResolutionService';
import { CollectionId } from '../../domain/value-objects/CollectionId';
import { CardId } from '../../domain/value-objects/CardId';
import { collections } from '../repositories/schema/collection.sql';
import { publishedRecords } from '../repositories/schema/publishedRecord.sql';
import { Result, ok, err } from 'src/shared/core/Result';

export class DrizzleAtUriResolutionService implements IAtUriResolutionService {
  constructor(private db: PostgresJsDatabase) {}

  async resolveAtUri(atUri: string): Promise<Result<AtUriResolutionResult | null>> {
    try {
      // Try collections first
      const collectionResult = await this.db
        .select({
          id: collections.id,
        })
        .from(collections)
        .innerJoin(publishedRecords, eq(collections.publishedRecordId, publishedRecords.id))
        .where(eq(publishedRecords.uri, atUri))
        .limit(1);

      if (collectionResult.length > 0) {
        const collectionIdResult = CollectionId.createFromString(collectionResult[0].id);
        if (collectionIdResult.isErr()) {
          return err(collectionIdResult.error);
        }
        
        return ok({
          type: AtUriResourceType.COLLECTION,
          id: collectionIdResult.value,
        });
      }

      // TODO: Add card resolution when needed
      // const cardResult = await this.db...

      return ok(null);
    } catch (error) {
      return err(error as Error);
    }
  }

  async resolveCollectionId(atUri: string): Promise<Result<CollectionId | null>> {
    const result = await this.resolveAtUri(atUri);
    
    if (result.isErr()) {
      return err(result.error);
    }

    if (!result.value || result.value.type !== AtUriResourceType.COLLECTION) {
      return ok(null);
    }

    return ok(result.value.id as CollectionId);
  }

  async resolveCardId(atUri: string): Promise<Result<CardId | null>> {
    // TODO: Implement when card support is added
    return ok(null);
  }
}
