import { Firehose, MemoryRunner, Event, CommitEvt } from '@atproto/sync';
import { IFirehoseService } from '../../application/services/IFirehoseService';
import { FirehoseEventHandler } from '../../application/handlers/FirehoseEventHandler';
import { EnvironmentConfigService } from 'src/shared/infrastructure/config/EnvironmentConfigService';
import { IdResolver } from '@atproto/identity';
import { FirehoseEvent } from '../../domain/FirehoseEvent';

// Event type constants from @atproto/sync
const COMMIT_EVENTS = ['create', 'update', 'delete'] as const;
const IGNORED_EVENTS = ['identity', 'sync', 'account'] as const;

type CommitEventType = typeof COMMIT_EVENTS[number];
type IgnoredEventType = typeof IGNORED_EVENTS[number];

class FirehoseEventFilter {
  static isCommitEvent(event: Event): event is CommitEvt {
    return COMMIT_EVENTS.includes(event.event as CommitEventType);
  }

  static shouldIgnoreEvent(event: Event): boolean {
    return IGNORED_EVENTS.includes(event.event as IgnoredEventType);
  }

  static isProcessableEvent(event: Event): event is CommitEvt {
    return this.isCommitEvent(event) && !this.shouldIgnoreEvent(event);
  }
}

export class AtProtoFirehoseService implements IFirehoseService {
  private firehose?: Firehose;
  private runner?: MemoryRunner;
  private isRunningFlag = false;

  constructor(
    private firehoseEventHandler: FirehoseEventHandler,
    private configService: EnvironmentConfigService,
    private idResolver: IdResolver,
  ) {}

  async start(): Promise<void> {
    if (this.isRunningFlag) {
      return;
    }

    try {
      console.log('Starting AT Protocol firehose service...');

      const runner = new MemoryRunner({});
      this.runner = runner;

      this.firehose = new Firehose({
        service: this.configService.getAtProtoConfig().firehoseWebsocket,
        runner,
        idResolver: this.idResolver,
        filterCollections: this.getFilteredCollections(),
        handleEvent: this.handleFirehoseEvent.bind(this),
        onError: this.handleError.bind(this),
      });

      await this.firehose.start();
      this.isRunningFlag = true;
      console.log('AT Protocol firehose service started');
    } catch (error) {
      console.error('Failed to start firehose:', error);
      await this.reconnect();
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunningFlag) {
      return;
    }

    console.log('Stopping AT Protocol firehose service...');

    if (this.firehose) {
      await this.firehose.destroy();
      this.firehose = undefined;
    }

    if (this.runner) {
      await this.runner.destroy();
      this.runner = undefined;
    }

    this.isRunningFlag = false;
    console.log('AT Protocol firehose service stopped');
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  private async handleFirehoseEvent(evt: Event): Promise<void> {
    // Use the filter to check if we should process this event
    if (!FirehoseEventFilter.isProcessableEvent(evt)) {
      return;
    }

    // Create FirehoseEvent value object
    const firehoseEventResult = FirehoseEvent.fromCommitEvent(evt);
    if (firehoseEventResult.isErr()) {
      console.error('Failed to create FirehoseEvent:', firehoseEventResult.error);
      return;
    }

    const result = await this.firehoseEventHandler.handle(firehoseEventResult.value);

    if (result.isErr()) {
      console.error('Failed to process firehose event:', result.error);
    }
  }

  private handleError(err: Error): void {
    console.error('Firehose error:', err);
    
    // Only reconnect on connection errors, not parsing errors
    if (err.name === 'FirehoseParseError') {
      console.warn('Skipping reconnection for parse error');
      return;
    }
    
    if (this.isRunningFlag) {
      this.reconnect();
    }
  }

  private async reconnect(): Promise<void> {
    console.log('Attempting to reconnect firehose...');
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    try {
      await this.stop();
      await this.start();
    } catch (error) {
      console.error('Reconnection failed:', error);
      // Try again after another delay
      setTimeout(() => this.reconnect(), 10000);
    }
  }

  private getFilteredCollections(): string[] {
    const collections = this.configService.getAtProtoCollections();
    return [
      collections.card,
      collections.collection,
      collections.collectionLink,
    ];
  }
}
