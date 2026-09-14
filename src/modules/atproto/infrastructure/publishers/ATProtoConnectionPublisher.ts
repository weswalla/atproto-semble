import { IConnectionPublisher } from 'src/modules/cards/application/ports/IConnectionPublisher';
import { Connection } from 'src/modules/cards/domain/Connection';
import { Result } from 'src/shared/core/Result';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { PublishedRecordId } from 'src/modules/cards/domain/value-objects/PublishedRecordId';

/**
 * Routes connection publishing to the public-repo publisher or the private
 * library-space publisher based on the connection's visibility (publishes) or
 * the record uri (unpublishes — space record uris carry a /space/ segment).
 */
export class ATProtoConnectionPublisher implements IConnectionPublisher {
  constructor(
    private readonly publicPublisher: IConnectionPublisher,
    private readonly privatePublisher: IConnectionPublisher,
  ) {}

  publish(
    connection: Connection,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const target = connection.isPrivate
      ? this.privatePublisher
      : this.publicPublisher;
    return target.publish(connection);
  }

  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>> {
    const target = recordId.uri.includes('/space/')
      ? this.privatePublisher
      : this.publicPublisher;
    return target.unpublish(recordId);
  }
}
