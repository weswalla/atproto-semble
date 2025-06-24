import {
  ICollectionPublisher,
  CollectionPublishResult,
} from "../../application/ports/ICollectionPublisher";
import { Collection } from "../../domain/Collection";
import { PublishedRecordId } from "../../domain/value-objects/PublishedRecordId";
import { ok, Result } from "../../../../shared/core/Result";
import { UseCaseError } from "../../../../shared/core/UseCaseError";

export class FakeCollectionPublisher implements ICollectionPublisher {
  private publishedCollections: Map<string, Collection> = new Map();
  private publishedLinks: Map<
    string,
    { cardId: string; linkRecord: PublishedRecordId }[]
  > = new Map();

  async publish(
    collection: Collection
  ): Promise<Result<CollectionPublishResult, UseCaseError>> {
    const collectionId = collection.collectionId.getStringValue();

    // Simulate publishing unpublished card links
    const unpublishedLinks = collection.unpublishedCardLinks;
    const publishedLinks: Array<{
      cardId: string;
      linkRecord: PublishedRecordId;
    }> = [];

    for (const link of unpublishedLinks) {
      const cardId = link.cardId.getStringValue();
      const fakeLinkUri = `at://fake-did/network.cosmik.cardCollectionLink/${collectionId}-${cardId}`;
      const fakeLinkCid = `fake-link-cid-${collectionId}-${cardId}`;

      const linkRecord = PublishedRecordId.create({
        uri: fakeLinkUri,
        cid: fakeLinkCid,
      });

      publishedLinks.push({
        cardId,
        linkRecord,
      });
    }

    // Store published links for inspection
    this.publishedLinks.set(collectionId, publishedLinks);

    // Simulate publishing the collection record itself
    const fakeCollectionUri = `at://fake-did/network.cosmik.collection/${collectionId}`;
    const fakeCollectionCid = `fake-collection-cid-${collectionId}`;

    const collectionRecord = PublishedRecordId.create({
      uri: fakeCollectionUri,
      cid: fakeCollectionCid,
    });

    // Store the published collection for inspection
    this.publishedCollections.set(collectionId, collection);

    const result: CollectionPublishResult = {
      collectionRecord,
      publishedLinks,
    };

    console.log(
      `[FakeCollectionPublisher] Published collection ${collectionId} with ${publishedLinks.length} links`
    );

    return ok(result);
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
