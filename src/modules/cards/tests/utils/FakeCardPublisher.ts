import {
  ICardPublisher,
  UnpublishCardOptions,
} from '../../application/ports/ICardPublisher';
import { Card } from '../../domain/Card';
import { PublishedRecordId } from '../../domain/value-objects/PublishedRecordId';
import { ok, err, Result } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { AppError } from '../../../../shared/core/AppError';
import { CuratorId } from 'src/modules/cards/domain/value-objects/CuratorId';
import { EnvironmentConfigService } from 'src/shared/infrastructure/config/EnvironmentConfigService';

export class FakeCardPublisher implements ICardPublisher {
  private publishedRecords: Map<string, Card> = new Map();
  private shouldFail: boolean = false;
  private shouldFailUnpublish: boolean = false;
  private unpublishedRecords: Array<{
    cardId: string;
    uri: string;
    cid: string;
    isPrivate?: boolean;
  }> = [];
  private publishTargets: Map<string, 'repo' | 'librarySpace'> = new Map();
  private cardType = new EnvironmentConfigService().getAtProtoCollections()
    .card;

  async publishCardToLibrary(
    card: Card,
    curatorId: CuratorId,
    parentCardPublishedRecordId?: PublishedRecordId,
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    if (this.shouldFail) {
      return err(
        AppError.UnexpectedError.create(new Error('Simulated publish failure')),
      );
    }

    const cardId = card.cardId.getStringValue();
    // Simulate generating an AT URI based on curator DID and collection/rkey.
    // Private cards land in the curator's library space; the uri makes the
    // location assertable in tests.
    const fakeUri = card.isPrivate
      ? `at://${curatorId.value}/space/network.cosmik.library/self/${this.cardType}/${cardId}`
      : `at://${curatorId.value}/${this.cardType}/${cardId}`;
    const fakeCid = card.isPrivate
      ? `fake-space-cid-${cardId}`
      : `fake-cid-${cardId}`;
    const publishedRecordId = PublishedRecordId.create({
      uri: fakeUri,
      cid: fakeCid,
    });

    // Store the published card for inspection using composite key
    const compositeKey = fakeUri + fakeCid;
    this.publishedRecords.set(compositeKey, card);
    this.publishTargets.set(
      compositeKey,
      card.isPrivate ? 'librarySpace' : 'repo',
    );

    console.log(
      `[FakeCardPublisher] Published card ${cardId} to curator ${curatorId.value} library at ${fakeUri}`,
    );
    return ok(publishedRecordId);
  }

  async unpublishCardFromLibrary(
    recordId: PublishedRecordId,
    curatorId: CuratorId,
    options?: UnpublishCardOptions,
  ): Promise<Result<void, UseCaseError>> {
    if (this.shouldFailUnpublish) {
      return err(
        AppError.UnexpectedError.create(
          new Error('Simulated unpublish failure'),
        ),
      );
    }

    const compositeKey = recordId.uri + recordId.cid;
    let card: Card | undefined;
    if (this.publishedRecords.has(compositeKey)) {
      card = this.publishedRecords.get(compositeKey);
      this.publishedRecords.delete(compositeKey);
      console.log(
        `[FakeCardPublisher] Unpublished record ${recordId.uri} from curator ${curatorId.value} library`,
      );
    }
    this.unpublishedRecords.push({
      cardId: card?.cardId.getStringValue() || '',
      uri: recordId.uri,
      cid: recordId.cid,
      isPrivate: options?.isPrivate,
    });
    return ok(undefined);
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setShouldFailUnpublish(shouldFailUnpublish: boolean): void {
    this.shouldFailUnpublish = shouldFailUnpublish;
  }

  clear(): void {
    this.publishedRecords.clear();
    this.publishTargets.clear();
    this.unpublishedRecords = [];
    this.shouldFail = false;
    this.shouldFailUnpublish = false;
  }

  getPublishedCards(): Card[] {
    return Array.from(this.publishedRecords.values());
  }

  getPrivatelyPublishedCards(): Card[] {
    const result: Card[] = [];
    for (const [key, card] of this.publishedRecords.entries()) {
      if (this.publishTargets.get(key) === 'librarySpace') {
        result.push(card);
      }
    }
    return result;
  }

  getPublishTarget(
    uri: string,
    cid: string,
  ): 'repo' | 'librarySpace' | undefined {
    return this.publishTargets.get(uri + cid);
  }

  getUnpublishedCards(): Array<{
    cardId: string;
    uri: string;
    cid: string;
    isPrivate?: boolean;
  }> {
    // For testing purposes, track unpublished cards
    // This is a simplified implementation for test verification
    return this.unpublishedRecords;
  }
}
