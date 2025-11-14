import { Result, ok, err } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { AppError } from 'src/shared/core/AppError';
import { ICardRepository } from '../../../cards/domain/ICardRepository';
import { IAtUriResolutionService } from '../../../cards/domain/services/IAtUriResolutionService';

export interface ProcessCardFirehoseEventDTO {
  atUri: string;
  cid: string | null;
  eventType: 'create' | 'update' | 'delete';
  record?: any;
}

export class ProcessCardFirehoseEventUseCase implements UseCase<ProcessCardFirehoseEventDTO, Result<void>> {
  constructor(
    private cardRepository: ICardRepository,
    private atUriResolutionService: IAtUriResolutionService
  ) {}

  async execute(request: ProcessCardFirehoseEventDTO): Promise<Result<void>> {
    try {
      console.log(`Processing card firehose event: ${request.atUri} (${request.eventType})`);

      switch (request.eventType) {
        case 'create':
        case 'update':
          // For now, we'll just log these events
          // In the future, we could sync external cards into our system
          console.log(`Card ${request.eventType} event for ${request.atUri}`);
          break;
        case 'delete':
          // Handle card deletion if we have it in our system
          const cardIdResult = await this.atUriResolutionService.resolveCardId(request.atUri);
          if (cardIdResult.isErr()) {
            return err(AppError.UnexpectedError.create(cardIdResult.error));
          }
          
          if (cardIdResult.value) {
            console.log(`Card deleted externally: ${request.atUri}, removing from our system`);
            const deleteResult = await this.cardRepository.delete(cardIdResult.value);
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
