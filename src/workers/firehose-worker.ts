import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';
import { RepositoryFactory } from '../shared/infrastructure/http/factories/RepositoryFactory';
import { ServiceFactory } from '../shared/infrastructure/http/factories/ServiceFactory';
import { UseCaseFactory } from '../shared/infrastructure/http/factories/UseCaseFactory';
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
  const useCases = UseCaseFactory.createForWorker(repositories, services);

  // Get database connection for duplication service
  const db = DatabaseFactory.createConnection(
    configService.getDatabaseConfig(),
  );

  // Create firehose-specific services
  const duplicationService = new DrizzleFirehoseEventDuplicationService(
    db,
    repositories.atUriResolutionService,
    configService,
  );

  // Create specific event processing use cases
  const processCardFirehoseEventUseCase = new ProcessCardFirehoseEventUseCase(
    repositories.atUriResolutionService,
    useCases.addUrlToLibraryUseCase,
    useCases.updateUrlCardAssociationsUseCase,
    useCases.removeCardFromLibraryUseCase,
  );

  const processCollectionFirehoseEventUseCase =
    new ProcessCollectionFirehoseEventUseCase(
      repositories.atUriResolutionService,
      useCases.createCollectionUseCase,
      useCases.updateCollectionUseCase,
      useCases.deleteCollectionUseCase,
    );

  const processCollectionLinkFirehoseEventUseCase =
    new ProcessCollectionLinkFirehoseEventUseCase(
      repositories.atUriResolutionService,
      useCases.updateUrlCardAssociationsUseCase,
    );

  // Create main processing use case
  const processFirehoseEventUseCase = new ProcessFirehoseEventUseCase(
    duplicationService,
    configService,
    processCardFirehoseEventUseCase,
    processCollectionFirehoseEventUseCase,
    processCollectionLinkFirehoseEventUseCase,
  );

  const firehoseEventHandler = new FirehoseEventHandler(
    processFirehoseEventUseCase,
  );

  const firehoseWorker = new FirehoseWorkerProcess(
    configService,
    firehoseEventHandler,
  );

  await firehoseWorker.start();
}

main().catch((error) => {
  console.error('Failed to start firehose worker:', error);
  process.exit(1);
});
