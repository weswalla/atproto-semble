import { ICardPublisher } from "../../application/ports/ICardPublisher";
import { Card } from "../../domain/Card";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { ok, Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { CuratorId } from "src/modules/annotations/domain/value-objects/CuratorId";

export class FakeCardPublisher implements ICardPublisher {
  private publishedRecords: Map<string, Card> = new Map();

  async publishCardToLibrary(
    card: Card,
    curatorId: CuratorId
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const cardId = card.cardId.getStringValue();
    // Simulate generating an AT URI based on curator DID and collection/rkey
    const fakeUri = `at://${curatorId.value}/network.cosmik.card/${cardId}`;
    const fakeCid = `fake-cid-${cardId}`;
    const publishedRecordId = PublishedRecordId.create({
      uri: fakeUri,
      cid: fakeCid,
    });

    // Store the published card for inspection using composite key
    const compositeKey = fakeUri + fakeCid;
    this.publishedRecords.set(compositeKey, card);

    console.log(`[FakeCardPublisher] Published card ${cardId} to curator ${curatorId.value} library at ${fakeUri}`);
    return ok(publishedRecordId);
  }

  async unpublishCardFromLibrary(
    recordId: PublishedRecordId,
    curatorId: CuratorId
  ): Promise<Result<void, UseCaseError>> {
    const compositeKey = recordId.uri + recordId.cid;
    if (this.publishedRecords.has(compositeKey)) {
      this.publishedRecords.delete(compositeKey);
      console.log(`[FakeCardPublisher] Unpublished record ${recordId.uri} from curator ${curatorId.value} library`);
      return ok(undefined);
    } else {
      console.warn(
        `[FakeCardPublisher] Record not found for unpublishing: ${recordId.uri}`
      );
      return ok(undefined);
    }
  }

  clear(): void {
    this.publishedRecords.clear();
  }

  getPublishedCards(): Card[] {
    return Array.from(this.publishedRecords.values());
  }
}
