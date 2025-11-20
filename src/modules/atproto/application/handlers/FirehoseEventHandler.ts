import { Result } from 'src/shared/core/Result';
import { ProcessFirehoseEventUseCase } from '../useCases/ProcessFirehoseEventUseCase';
import { FirehoseEvent } from '../../domain/FirehoseEvent';

export class FirehoseEventHandler {
  constructor(
    private processFirehoseEventUseCase: ProcessFirehoseEventUseCase,
    private delayMs: number = 30000, // 30 seconds default
  ) {}

  async handle(event: FirehoseEvent): Promise<Result<void>> {
    // Add delay before processing
    await new Promise(resolve => setTimeout(resolve, this.delayMs));
    
    return this.processFirehoseEventUseCase.execute({
      atUri: event.atUri.value,
      cid: event.cid,
      eventType: event.eventType,
      record: event.record,
    });
  }
}
