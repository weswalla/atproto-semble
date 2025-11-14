import { Result, ok, err } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { AppError } from 'src/shared/core/AppError';
import { ICollectionRepository } from '../../../cards/domain/ICollectionRepository';
import { IAtUriResolutionService } from '../../../cards/domain/services/IAtUriResolutionService';

export interface ProcessCollectionLinkFirehoseEventDTO {
  atUri: string;
  cid: string | null;
  eventType: 'create' | 'update' | 'delete';
  record?: any;
}

export class ProcessCollectionLinkFirehoseEventUseCase implements UseCase<ProcessCollectionLinkFirehoseEventDTO, Result<void>> {
  constructor(
    private collectionRepository: ICollectionRepository,
    private atUriResolutionService: IAtUriResolutionService
  ) {}

  async execute(request: ProcessCollectionLinkFirehoseEventDTO): Promise<Result<void>> {
    try {
      console.log(`Processing collection link firehose event: ${request.atUri} (${request.eventType})`);

      switch (request.eventType) {
        case 'create':
          // For now, we'll just log these events
          // In the future, we could sync external collection links into our system
          console.log(`Collection link ${request.eventType} event for ${request.atUri}`);
          break;
        case 'delete':
          // Handle collection link deletion if we have it in our system
          const linkInfoResult = await this.atUriResolutionService.resolveCollectionLinkId(request.atUri);
          if (linkInfoResult.isErr()) {
            return err(AppError.UnexpectedError.create(linkInfoResult.error));
          }
          
          if (linkInfoResult.value) {
            console.log(`Collection link deleted externally: ${request.atUri}, removing from our system`);
            
            // Find the collection and remove the card link
            const collectionResult = await this.collectionRepository.findById(linkInfoResult.value.collectionId);
            if (collectionResult.isErr()) {
              return err(AppError.UnexpectedError.create(collectionResult.error));
            }

            const collection = collectionResult.value;
            if (collection) {
              // Remove the card from the collection
              const removeResult = collection.removeCard(
                linkInfoResult.value.cardId,
                collection.authorId // Use collection author as the curator
              );
              if (removeResult.isErr()) {
                console.warn(`Failed to remove card from collection: ${removeResult.error.message}`);
              } else {
                // Save the updated collection
                const saveResult = await this.collectionRepository.save(collection);
                if (saveResult.isErr()) {
                  return err(AppError.UnexpectedError.create(saveResult.error));
                }
              }
            }
          }
          break;
        case 'update':
          // Collection links don't typically have update operations
          console.log(`Collection link update event for ${request.atUri} (unusual)`);
          break;
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
