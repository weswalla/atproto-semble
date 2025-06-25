import { Collection } from "../../domain/Collection";
import { Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { CuratorId } from "src/modules/annotations/domain/value-objects";
import { Card } from "../../domain/Card";

export interface ICollectionPublisher {
  publish(
    collection: Collection
  ): Promise<Result<PublishedRecordId, UseCaseError>>;

  unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>>;
  publishCardAddedToCollection(
    card: Card,
    collection: Collection,
    curatorId: CuratorId
  ): Promise<Result<PublishedRecordId, UseCaseError>>;
  unpublishCardAddedToCollection(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>>;
}
