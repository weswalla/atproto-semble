import { ICardPublisher } from "../../application/ports/ICardPublisher";
import { Card } from "../../domain/Card";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { ok, Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";

export class FakeCardPublisher implements ICardPublisher {
  private publishedRecords: Map<string, Card> = new Map();

  async publish(card: Card): Promise<Result<PublishedRecordId, UseCaseError>> {
    const cardId = card.cardId.getStringValue();
    // Simulate generating an AT URI based on DID and collection/rkey
    const fakeUri = `at://fake-did/app.cards.card/${cardId}`;
    const fakeCid = `fake-cid-${cardId}`;
    const publishedRecordId = PublishedRecordId.create({
      uri: fakeUri,
      cid: fakeCid,
    });

    // Store the published card for inspection using composite key
    const compositeKey = fakeUri + fakeCid;
    this.publishedRecords.set(compositeKey, card);

    console.log(
      `[FakeCardPublisher] Published card ${cardId} to ${fakeUri}`
    );
    return ok(publishedRecordId);
  }

  async unpublish(recordId: PublishedRecordId): Promise<Result<void, UseCaseError>> {
    const compositeKey = recordId.uri + recordId.cid;
    if (this.publishedRecords.has(compositeKey)) {
      this.publishedRecords.delete(compositeKey);
      console.log(`[FakeCardPublisher] Unpublished record ${recordId.uri}`);
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
