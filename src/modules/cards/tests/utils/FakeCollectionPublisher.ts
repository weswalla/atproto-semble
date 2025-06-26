import { ICollectionPublisher } from "../../application/ports/ICollectionPublisher";
import { Collection } from "../../domain/Collection";
import { Card } from "../../domain/Card";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { ok, Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";
import { CuratorId } from "../../../annotations/domain/value-objects/CuratorId";

export class FakeCollectionPublisher implements ICollectionPublisher {
  private publishedCollections: Map<string, Collection> = new Map();
  private publishedLinks: Map<
    string,
    { cardId: string; linkRecord: PublishedRecordId }[]
  > = new Map();

  async publish(
    collection: Collection
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const collectionId = collection.collectionId.getStringValue();

    // Simulate publishing the collection record itself
    const fakeCollectionUri = `at://fake-did/network.cosmik.collection/${collectionId}`;
    const fakeCollectionCid = `fake-collection-cid-${collectionId}`;

    const collectionRecord = PublishedRecordId.create({
      uri: fakeCollectionUri,
      cid: fakeCollectionCid,
    });

    // Store the published collection for inspection
    this.publishedCollections.set(collectionId, collection);

    console.log(
      `[FakeCollectionPublisher] Published collection ${collectionId}`
    );

    return ok(collectionRecord);
  }

  async publishCardAddedToCollection(
    card: Card,
    collection: Collection,
    curatorId: CuratorId
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    const collectionId = collection.collectionId.getStringValue();
    const cardId = card.cardId.getStringValue();

    // Simulate publishing a card-collection link
    const fakeLinkUri = `at://${curatorId.value}/network.cosmik.cardCollectionLink/${collectionId}-${cardId}`;
    const fakeLinkCid = `fake-link-cid-${collectionId}-${cardId}`;

    const linkRecord = PublishedRecordId.create({
      uri: fakeLinkUri,
      cid: fakeLinkCid,
    });

    // Store published link for inspection
    const existingLinks = this.publishedLinks.get(collectionId) || [];
    existingLinks.push({
      cardId,
      linkRecord,
    });
    this.publishedLinks.set(collectionId, existingLinks);

    console.log(
      `[FakeCollectionPublisher] Published card ${cardId} added to collection ${collectionId} link at ${fakeLinkUri}`
    );

    return ok(linkRecord);
  }

  async unpublishCardAddedToCollection(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    // Find and remove the link by its published record ID
    for (const [collectionId, links] of this.publishedLinks.entries()) {
      const linkIndex = links.findIndex(
        (link) => link.linkRecord.uri === recordId.uri
      );
      if (linkIndex !== -1) {
        links.splice(linkIndex, 1);
        console.log(
          `[FakeCollectionPublisher] Unpublished card-collection link ${recordId.uri}`
        );
        return ok(undefined);
      }
    }

    console.warn(
      `[FakeCollectionPublisher] Card-collection link not found for unpublishing: ${recordId.uri}`
    );
    return ok(undefined);
  }

  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    // Find and remove the collection by its published record ID
    for (const [
      collectionId,
      collection,
    ] of this.publishedCollections.entries()) {
      if (collection.publishedRecordId?.uri === recordId.uri) {
        this.publishedCollections.delete(collectionId);
        this.publishedLinks.delete(collectionId);
        console.log(
          `[FakeCollectionPublisher] Unpublished collection ${recordId.uri}`
        );
        return ok(undefined);
      }
    }

    console.warn(
      `[FakeCollectionPublisher] Collection not found for unpublishing: ${recordId.uri}`
    );
    return ok(undefined);
  }

  clear(): void {
    this.publishedCollections.clear();
    this.publishedLinks.clear();
  }

  getPublishedCollections(): Collection[] {
    return Array.from(this.publishedCollections.values());
  }

  getPublishedLinksForCollection(
    collectionId: string
  ): Array<{ cardId: string; linkRecord: PublishedRecordId }> {
    return this.publishedLinks.get(collectionId) || [];
  }
}
