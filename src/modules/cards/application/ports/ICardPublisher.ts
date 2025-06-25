import { Card } from "../../domain/Card";
import { Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { CuratorId } from "src/modules/annotations/domain/value-objects";

export interface ICardPublisher {
  publishCardToLibrary(
    card: Card,
    curatorId: CuratorId
  ): Promise<Result<PublishedRecordId, UseCaseError>>;

  unpublishCardFromLibrary(
    recordId: PublishedRecordId,
    curatorId: CuratorId
  ): Promise<Result<void, UseCaseError>>;
}
