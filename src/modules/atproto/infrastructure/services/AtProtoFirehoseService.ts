import { Firehose, MemoryRunner, Event, CommitEvt } from '@atproto/sync';
import { IFirehoseService } from '../../application/services/IFirehoseService';
import { FirehoseEventHandler } from '../../application/handlers/FirehoseEventHandler';
import { EnvironmentConfigService } from 'src/shared/infrastructure/config/EnvironmentConfigService';
import { IdResolver } from '@atproto/identity';

export class AtProtoFirehoseService implements IFirehoseService {
  private firehose?: Firehose;
  private runner?: MemoryRunner;
  private isRunningFlag = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // Start with 5 seconds
  private maxReconnectDelay = 300000; // Max 5 minutes
  private lastEventTime = Date.now();

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
      this.reconnectAttempts = 0; // Reset on successful start
      this.lastEventTime = Date.now();
      console.log('AT Protocol firehose service started');
      
      this.startHealthMonitoring();
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
    // Update last event time for health monitoring
    this.lastEventTime = Date.now();

    // Only process commit events (create, update, delete)
    if (
      evt.event !== 'create' &&
      evt.event !== 'update' &&
      evt.event !== 'delete'
    ) {
      return;
    }

    const commitEvt = evt as CommitEvt;

    const result = await this.firehoseEventHandler.handle({
      uri: commitEvt.uri.toString(),
      cid: commitEvt.event === 'delete' ? null : commitEvt.cid.toString(),
      eventType: commitEvt.event,
      record: commitEvt.event === 'delete' ? undefined : commitEvt.record,
      did: commitEvt.did,
      collection: commitEvt.collection,
    });

    if (result.isErr()) {
      console.error('Failed to process firehose event:', result.error);
    }
  }

  private handleError(err: Error): void {
    console.error('Firehose error:', err);
    if (this.isRunningFlag) {
      this.reconnect();
    }
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Stopping.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.stop();
      await this.start();
    } catch (error) {
      console.error('Reconnection failed:', error);
      await this.reconnect(); // Try again
    }
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      const timeSinceLastEvent = Date.now() - this.lastEventTime;
      const healthThreshold = 60000; // 1 minute without events is concerning
      
      if (timeSinceLastEvent > healthThreshold && this.isRunningFlag) {
        console.warn(`No events received for ${timeSinceLastEvent}ms. Connection may be stale.`);
        this.reconnect();
      }
    }, 30000); // Check every 30 seconds
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
