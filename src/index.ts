import { configService } from './shared/infrastructure/config';
import { AppProcess } from './shared/infrastructure/processes/AppProcess';
import { FeedWorkerProcess } from './shared/infrastructure/processes/FeedWorkerProcess';
import { InMemoryEventWorkerProcess } from './shared/infrastructure/processes/InMemoryEventWorkerProcess';

async function main() {
  const appProcess = new AppProcess(configService);

  // Start the app process
  await appProcess.start();

  // Start appropriate worker based on event system type
  const useInMemoryEvents = process.env.USE_IN_MEMORY_EVENTS === 'true';
  if (useInMemoryEvents) {
    console.log('Starting in-memory event worker in the same process...');
    const inMemoryWorkerProcess = new InMemoryEventWorkerProcess(configService);
    await inMemoryWorkerProcess.start();
  } else {
    console.log('Starting BullMQ feed worker in the same process...');
    const feedWorkerProcess = new FeedWorkerProcess(configService);
    await feedWorkerProcess.start();
  }
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
