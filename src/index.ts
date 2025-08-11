import { configService } from './shared/infrastructure/config';
import { AppProcess } from './shared/infrastructure/processes/AppProcess';
import { FeedWorkerProcess } from './shared/infrastructure/processes/FeedWorkerProcess';

async function main() {
  const appProcess = new AppProcess(configService);

  // Start the app process
  await appProcess.start();

  // Start feed worker in the same process if using in-memory events
  const useInMemoryEvents = process.env.USE_IN_MEMORY_EVENTS === 'true';
  if (useInMemoryEvents) {
    console.log('Starting feed worker in the same process...');
    const feedWorkerProcess = new FeedWorkerProcess(configService);
    await feedWorkerProcess.start();
  }
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
