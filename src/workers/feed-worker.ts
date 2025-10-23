import { EnvironmentConfigService } from '../shared/infrastructure/config/EnvironmentConfigService';
import { FeedWorkerProcess } from '../shared/infrastructure/processes/FeedWorkerProcess';

async function main() {
  const configService = new EnvironmentConfigService();
  const feedWorkerProcess = new FeedWorkerProcess(configService);

  await feedWorkerProcess.start();
}

if (process.env.USE_IN_MEMORY_EVENTS !== 'true') {
  main().catch((error) => {
    console.error('Failed to start feed worker:', error);
    process.exit(1);
  });
} else {
  console.log('Skipping feed worker startup - using in-memory events (worker runs inside main process)');
}
