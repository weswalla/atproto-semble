import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';
import { FeedWorkerProcess } from '../shared/infrastructure/processes/FeedWorkerProcess';

async function main() {
  const useInMemoryEvents = process.env.USE_IN_MEMORY_EVENTS === 'true';

  if (useInMemoryEvents) {
    console.log(
      'Skipping feed worker startup - using in-memory events (handled by main process)',
    );
    return;
  }

  console.log('Starting dedicated feed worker process...');
  const configService = new EnvironmentConfigService();
  const feedWorkerProcess = new FeedWorkerProcess(configService);

  await feedWorkerProcess.start();
}

main().catch((error) => {
  console.error('Failed to start feed worker:', error);
  process.exit(1);
});
