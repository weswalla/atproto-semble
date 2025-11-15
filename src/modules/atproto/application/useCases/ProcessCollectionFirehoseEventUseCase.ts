import { Result, ok, err } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { AppError } from 'src/shared/core/AppError';
import { ICollectionRepository } from '../../../cards/domain/ICollectionRepository';
import { IAtUriResolutionService } from '../../../cards/domain/services/IAtUriResolutionService';
import { IEventPublisher } from '../../../shared/application/events/IEventPublisher';
import { Collection, CollectionAccessType } from '../../../cards/domain/Collection';
import { CuratorId } from '../../../cards/domain/value-objects/CuratorId';
import { PublishedRecordId } from '../../../cards/domain/value-objects/PublishedRecordId';
import { Record as CollectionRecord } from '../../infrastructure/lexicon/types/network/cosmik/collection';

export interface ProcessCollectionFirehoseEventDTO {
  atUri: string;
  cid: string | null;
  eventType: 'create' | 'update' | 'delete';
  record?: CollectionRecord;
}

export class ProcessCollectionFirehoseEventUseCase implements UseCase<ProcessCollectionFirehoseEventDTO, Result<void>> {
  constructor(
    private collectionRepository: ICollectionRepository,
    private atUriResolutionService: IAtUriResolutionService,
    private eventPublisher: IEventPublisher,
  ) {}

  async execute(request: ProcessCollectionFirehoseEventDTO): Promise<Result<void>> {
    try {
      console.log(`Processing collection firehose event: ${request.atUri} (${request.eventType})`);

      switch (request.eventType) {
        case 'create':
          return await this.handleCollectionCreate(request);
        case 'update':
          return await this.handleCollectionUpdate(request);
        case 'delete':
          return await this.handleCollectionDelete(request);
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }

  private async handleCollectionCreate(request: ProcessCollectionFirehoseEventDTO): Promise<Result<void>> {
    if (!request.record || !request.cid) {
      console.warn('Collection create event missing record or cid, skipping');
      return ok(undefined);
    }

    try {
      // Extract author DID from AT URI
      const atUriParts = request.atUri.split('/');
      if (atUriParts.length < 3) {
        console.warn(`Invalid AT URI format: ${request.atUri}`);
        return ok(undefined);
      }
      const authorDid = atUriParts[2]; // at://did:plc:xxx/collection/rkey

      // Create CuratorId
      const authorIdResult = CuratorId.create(authorDid);
      if (authorIdResult.isErr()) {
        console.warn(`Invalid author DID: ${authorDid}`);
        return ok(undefined);
      }

      // Map collaborators
      const collaboratorIds: CuratorId[] = [];
      if (request.record.collaborators) {
        for (const collaboratorDid of request.record.collaborators) {
          const collaboratorIdResult = CuratorId.create(collaboratorDid);
          if (collaboratorIdResult.isOk()) {
            collaboratorIds.push(collaboratorIdResult.value);
          }
        }
      }

      // Create collection using existing factory method
      const collectionResult = Collection.create({
        authorId: authorIdResult.value,
        name: request.record.name,
        description: request.record.description,
        accessType: this.mapAccessType(request.record.accessType),
        collaboratorIds: collaboratorIds,
        createdAt: request.record.createdAt ? new Date(request.record.createdAt) : new Date(),
        updatedAt: request.record.updatedAt ? new Date(request.record.updatedAt) : new Date(),
      });

      if (collectionResult.isErr()) {
        console.warn(`Failed to create collection from firehose event: ${collectionResult.error.message}`);
        return ok(undefined);
      }

      const collection = collectionResult.value;

      // Mark as published with the AT Protocol record ID
      const publishedRecordId = PublishedRecordId.create({
        uri: request.atUri,
        cid: request.cid,
      });
      collection.markAsPublished(publishedRecordId);

      // Save to repository
      const saveResult = await this.collectionRepository.save(collection);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      // Store AT URI mapping for future resolution
      await this.atUriResolutionService.storeCollectionMapping(request.atUri, collection.collectionId);

      // Publish domain events
      await this.publishDomainEvents(collection);

      console.log(`Successfully created collection from firehose event: ${collection.collectionId.getStringValue()}`);
      return ok(undefined);

    } catch (error) {
      console.error(`Error processing collection create event: ${error}`);
      return ok(undefined); // Don't fail the firehose processing
    }
  }

  private async handleCollectionUpdate(request: ProcessCollectionFirehoseEventDTO): Promise<Result<void>> {
    if (!request.record || !request.cid) {
      console.warn('Collection update event missing record or cid, skipping');
      return ok(undefined);
    }

    try {
      // Resolve existing collection
      const collectionIdResult = await this.atUriResolutionService.resolveCollectionId(request.atUri);
      if (collectionIdResult.isErr()) {
        console.warn(`Failed to resolve collection ID for ${request.atUri}: ${collectionIdResult.error.message}`);
        return ok(undefined);
      }

      if (!collectionIdResult.value) {
        console.log(`Collection not found in our system: ${request.atUri}`);
        return ok(undefined);
      }

      const existingCollectionResult = await this.collectionRepository.findById(collectionIdResult.value);
      if (existingCollectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(existingCollectionResult.error));
      }

      const existingCollection = existingCollectionResult.value;
      if (!existingCollection) {
        console.log(`Collection not found: ${collectionIdResult.value.getStringValue()}`);
        return ok(undefined);
      }

      // Update collection details
      const updateResult = existingCollection.updateDetails(
        request.record.name,
        request.record.description,
      );
      if (updateResult.isErr()) {
        console.warn(`Failed to update collection details: ${updateResult.error.message}`);
        return ok(undefined);
      }

      // Update access type if changed
      const newAccessType = this.mapAccessType(request.record.accessType);
      if (existingCollection.accessType !== newAccessType) {
        const changeAccessResult = existingCollection.changeAccessType(
          newAccessType,
          existingCollection.authorId,
        );
        if (changeAccessResult.isErr()) {
          console.warn(`Failed to change access type: ${changeAccessResult.error.message}`);
        }
      }

      // Update published record ID
      const newPublishedRecordId = PublishedRecordId.create({
        uri: request.atUri,
        cid: request.cid,
      });
      existingCollection.markAsPublished(newPublishedRecordId);

      // Save updated collection
      const saveResult = await this.collectionRepository.save(existingCollection);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      // Publish domain events
      await this.publishDomainEvents(existingCollection);

      console.log(`Successfully updated collection from firehose event: ${existingCollection.collectionId.getStringValue()}`);
      return ok(undefined);

    } catch (error) {
      console.error(`Error processing collection update event: ${error}`);
      return ok(undefined); // Don't fail the firehose processing
    }
  }

  private async handleCollectionDelete(request: ProcessCollectionFirehoseEventDTO): Promise<Result<void>> {
    const collectionIdResult = await this.atUriResolutionService.resolveCollectionId(request.atUri);
    if (collectionIdResult.isErr()) {
      return err(AppError.UnexpectedError.create(collectionIdResult.error));
    }
    
    if (collectionIdResult.value) {
      console.log(`Collection deleted externally: ${request.atUri}, removing from our system`);
      const deleteResult = await this.collectionRepository.delete(collectionIdResult.value);
      if (deleteResult.isErr()) {
        return err(AppError.UnexpectedError.create(deleteResult.error));
      }
    }

    return ok(undefined);
  }

  private mapAccessType(accessType: string): CollectionAccessType {
    switch (accessType) {
      case 'OPEN':
        return CollectionAccessType.OPEN;
      case 'CLOSED':
        return CollectionAccessType.CLOSED;
      default:
        return CollectionAccessType.OPEN; // Default to open
    }
  }

  private async publishDomainEvents(collection: any): Promise<void> {
    try {
      const events = collection.domainEvents || [];
      if (events.length > 0) {
        const publishResult = await this.eventPublisher.publishEvents(events);
        if (publishResult.isErr()) {
          console.error('Failed to publish domain events:', publishResult.error);
        }
        collection.clearEvents?.(); // Clear events after publishing if method exists
      }
    } catch (error) {
      console.error('Error publishing domain events:', error);
    }
  }
}
