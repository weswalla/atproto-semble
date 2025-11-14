import { Result, ok, err } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { AppError } from 'src/shared/core/AppError';
import { ICollectionRepository } from '../../../cards/domain/ICollectionRepository';
import { IAtUriResolutionService } from '../../../cards/domain/services/IAtUriResolutionService';

export interface ProcessCollectionFirehoseEventDTO {
  atUri: string;
  cid: string | null;
  eventType: 'create' | 'update' | 'delete';
  record?: any;
}

export class ProcessCollectionFirehoseEventUseCase implements UseCase<ProcessCollectionFirehoseEventDTO, Result<void>> {
  constructor(
    private collectionRepository: ICollectionRepository,
    private atUriResolutionService: IAtUriResolutionService
  ) {}

  async execute(request: ProcessCollectionFirehoseEventDTO): Promise<Result<void>> {
    try {
      console.log(`Processing collection firehose event: ${request.atUri} (${request.eventType})`);

      switch (request.eventType) {
        case 'create':
        case 'update':
          // For now, we'll just log these events
          // In the future, we could sync external collections into our system
          console.log(`Collection ${request.eventType} event for ${request.atUri}`);
          break;
        case 'delete':
          // Handle collection deletion if we have it in our system
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
          break;
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
