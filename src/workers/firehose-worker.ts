import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';
import { RepositoryFactory } from '../shared/infrastructure/http/factories/RepositoryFactory';
import { ServiceFactory } from '../shared/infrastructure/http/factories/ServiceFactory';
import { FirehoseWorkerProcess } from '../modules/atproto/infrastructure/processes/FirehoseWorkerProcess';
import { FirehoseEventHandler } from '../modules/atproto/application/handlers/FirehoseEventHandler';
import { ProcessFirehoseEventUseCase } from '../modules/atproto/application/useCases/ProcessFirehoseEventUseCase';
import { ProcessCardFirehoseEventUseCase } from '../modules/atproto/application/useCases/ProcessCardFirehoseEventUseCase';
import { ProcessCollectionFirehoseEventUseCase } from '../modules/atproto/application/useCases/ProcessCollectionFirehoseEventUseCase';
import { ProcessCollectionLinkFirehoseEventUseCase } from '../modules/atproto/application/useCases/ProcessCollectionLinkFirehoseEventUseCase';
import { DrizzleFirehoseEventDuplicationService } from '../modules/atproto/infrastructure/services/DrizzleFirehoseEventDuplicationService';
import { DatabaseFactory } from '../shared/infrastructure/database/DatabaseFactory';

async function main() {
  console.log('Starting firehose worker...');

  const configService = new EnvironmentConfigService();
  const repositories = RepositoryFactory.create(configService);
  const services = ServiceFactory.createForWorker(configService, repositories);

  // Get database connection for duplication service
  const db = DatabaseFactory.createConnection(configService.getDatabaseConfig());

  // Create firehose-specific services
  const duplicationService = new DrizzleFirehoseEventDuplicationService(
    db,
    repositories.atUriResolutionService,
    configService
  );

  // Create specific event processing use cases
  const processCardFirehoseEventUseCase = new ProcessCardFirehoseEventUseCase(
    repositories.cardRepository,
    repositories.atUriResolutionService
  );

  const processCollectionFirehoseEventUseCase = new ProcessCollectionFirehoseEventUseCase(
    repositories.collectionRepository,
    repositories.atUriResolutionService
  );

  const processCollectionLinkFirehoseEventUseCase = new ProcessCollectionLinkFirehoseEventUseCase(
    repositories.collectionRepository,
    repositories.atUriResolutionService
  );

  // Create main processing use case
  const processFirehoseEventUseCase = new ProcessFirehoseEventUseCase(
    duplicationService,
    repositories.atUriResolutionService,
    repositories.cardRepository,
    repositories.collectionRepository,
    services.eventPublisher, // Publishes internal domain events
    configService,
    processCardFirehoseEventUseCase,
    processCollectionFirehoseEventUseCase,
    processCollectionLinkFirehoseEventUseCase
  );

  const firehoseEventHandler = new FirehoseEventHandler(processFirehoseEventUseCase);
  
  const firehoseWorker = new FirehoseWorkerProcess(
    configService,
    firehoseEventHandler
  );

  await firehoseWorker.start();
}

main().catch((error) => {
  console.error('Failed to start firehose worker:', error);
  process.exit(1);
});
