import {
  ICardPublisher,
  UnpublishCardOptions,
} from 'src/modules/cards/application/ports/ICardPublisher';
import { Card } from 'src/modules/cards/domain/Card';
import { Result } from 'src/shared/core/Result';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';
import { PublishedRecordId } from 'src/modules/cards/domain/value-objects/PublishedRecordId';

/**
 * Routes card publishing to the public-repo publisher or the private
 * library-space publisher based on the card's visibility (publishes) or the
 * caller-provided isPrivate option (unpublishes — the record uri alone does
 * not say where the record lives).
 */
export class ATProtoCardPublisher implements ICardPublisher {
  constructor(
    private readonly publicPublisher: ICardPublisher,
    private readonly privatePublisher: ICardPublisher,
  ) {}

  publishCardToLibrary(
    card: Card,
    curatorId: CuratorId,
    parentCardPublishedRecordId?: PublishedRecordId,
    viaCardPublishedRecordId?: PublishedRecordId,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const target = card.isPrivate
      ? this.privatePublisher
      : this.publicPublisher;
    return target.publishCardToLibrary(
      card,
      curatorId,
      parentCardPublishedRecordId,
      viaCardPublishedRecordId,
    );
  }

  unpublishCardFromLibrary(
    recordId: PublishedRecordId,
    curatorId: CuratorId,
    options?: UnpublishCardOptions,
  ): Promise<Result<void, UseCaseError>> {
    const target = options?.isPrivate
      ? this.privatePublisher
      : this.publicPublisher;
    return target.unpublishCardFromLibrary(recordId, curatorId, options);
  }
}
