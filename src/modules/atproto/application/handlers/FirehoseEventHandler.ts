import { Result } from 'src/shared/core/Result';
import { ProcessFirehoseEventUseCase } from '../useCases/ProcessFirehoseEventUseCase';
import { FirehoseEvent } from '../../domain/FirehoseEvent';

export class FirehoseEventHandler {
  constructor(
    private processFirehoseEventUseCase: ProcessFirehoseEventUseCase,
  ) {}

  async handle(event: FirehoseEvent): Promise<Result<void>> {
    return this.processFirehoseEventUseCase.execute({
      atUri: event.atUri.value,
      cid: event.cid,
      eventType: event.eventType,
      record: event.record,
    });
  }
}
