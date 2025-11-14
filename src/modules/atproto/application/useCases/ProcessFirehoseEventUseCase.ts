import { Result, ok, err } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { AppError } from 'src/shared/core/AppError';
import { IEventPublisher } from 'src/shared/application/events/IEventPublisher';
import { IFirehoseEventDuplicationService } from '../../domain/services/IFirehoseEventDuplicationService';
import { IAtUriResolutionService, AtUriResourceType } from '../../../cards/domain/services/IAtUriResolutionService';
import { ICardRepository } from '../../../cards/domain/ICardRepository';
import { ICollectionRepository } from '../../../cards/domain/ICollectionRepository';
import { ATUri } from '../../domain/ATUri';
import { EnvironmentConfigService } from 'src/shared/infrastructure/config/EnvironmentConfigService';
import { ProcessCardFirehoseEventUseCase } from './ProcessCardFirehoseEventUseCase';
import { ProcessCollectionFirehoseEventUseCase } from './ProcessCollectionFirehoseEventUseCase';
import { ProcessCollectionLinkFirehoseEventUseCase } from './ProcessCollectionLinkFirehoseEventUseCase';

export interface ProcessFirehoseEventDTO {
  atUri: string;
  cid: string | null;
  eventType: 'create' | 'update' | 'delete';
  record?: any; // The AT Protocol record data
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

export class ProcessFirehoseEventUseCase implements UseCase<ProcessFirehoseEventDTO, Result<void>> {
  constructor(
    private duplicationService: IFirehoseEventDuplicationService,
    private atUriResolutionService: IAtUriResolutionService,
    private cardRepository: ICardRepository,
    private collectionRepository: ICollectionRepository,
    private eventPublisher: IEventPublisher,
    private configService: EnvironmentConfigService,
    private processCardFirehoseEventUseCase: ProcessCardFirehoseEventUseCase,
    private processCollectionFirehoseEventUseCase: ProcessCollectionFirehoseEventUseCase,
    private processCollectionLinkFirehoseEventUseCase: ProcessCollectionLinkFirehoseEventUseCase
  ) {}

  async execute(request: ProcessFirehoseEventDTO): Promise<Result<void>> {
    try {
      // 1. Check for duplicates
      const isDuplicateResult = await this.duplicationService.hasEventBeenProcessed(
        request.atUri,
        request.cid,
        request.eventType
      );

      if (isDuplicateResult.isErr()) {
        return err(AppError.UnexpectedError.create(isDuplicateResult.error));
      }

      if (isDuplicateResult.value) {
        console.log(`Skipping duplicate firehose event: ${request.atUri} (${request.eventType})`);
        return ok(undefined);
      }

      // 2. Determine entity type from AT URI
      const atUriResult = ATUri.create(request.atUri);
      if (atUriResult.isErr()) {
        return err(new ValidationError(`Invalid AT URI: ${atUriResult.error.message}`));
      }

      const entityType = atUriResult.value.getEntityType(this.configService);

      // 3. Route to appropriate handler based on collection type
      switch (entityType) {
        case AtUriResourceType.CARD:
          return this.processCardFirehoseEventUseCase.execute(request);
        case AtUriResourceType.COLLECTION:
          return this.processCollectionFirehoseEventUseCase.execute(request);
        case AtUriResourceType.COLLECTION_LINK:
          return this.processCollectionLinkFirehoseEventUseCase.execute(request);
        default:
          return err(new ValidationError(`Unknown entity type: ${entityType}`));
      }
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
