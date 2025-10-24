import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';
import { SearchWorkerProcess } from '../shared/infrastructure/processes/SearchWorkerProcess';

async function main() {
  const useInMemoryEvents = process.env.USE_IN_MEMORY_EVENTS === 'true';

  if (useInMemoryEvents) {
    console.log(
      'Skipping search worker startup - using in-memory events (handled by main process)',
    );
    return;
  }

  console.log('Starting dedicated search worker process...');
  const configService = new EnvironmentConfigService();
  const searchWorkerProcess = new SearchWorkerProcess(configService);

  await searchWorkerProcess.start();
}

main().catch((error) => {
  console.error('Failed to start search worker:', error);
  process.exit(1);
});
