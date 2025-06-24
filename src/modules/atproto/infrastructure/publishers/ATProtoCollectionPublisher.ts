import {
  ICollectionPublisher,
  CollectionPublishResult,
} from "src/modules/cards/application/ports/ICollectionPublisher";
import { Collection } from "src/modules/cards/domain/Collection";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { PublishedRecordId } from "src/modules/cards/domain/value-objects/PublishedRecordId";
import { CollectionMapper } from "../mappers/CollectionMapper";
import { CollectionLinkMapper } from "../mappers/CollectionLinkMapper";
import { StrongRef } from "../../domain";
import { IAgentService } from "../../application/IAgentService";
import { DID } from "../../domain/DID";

export class ATProtoCollectionPublisher implements ICollectionPublisher {
  private readonly COLLECTION_COLLECTION = "app.cards.collection";
  private readonly COLLECTION_LINK_COLLECTION = "app.cards.collectionLink";

  constructor(private readonly agentService: IAgentService) {}

  /**
   * Publishes a Collection aggregate, including unpublished card links
   */
  async publish(
    collection: Collection
  ): Promise<Result<CollectionPublishResult, UseCaseError>> {
    try {
      const curatorDid = new DID(collection.authorId.value);

      // Get an authenticated agent for this curator
      const agentResult =
        await this.agentService.getAuthenticatedAgent(curatorDid);

      if (agentResult.isErr()) {
        return err(
          new Error(`Authentication error: ${agentResult.error.message}`)
        );
      }

      const agent = agentResult.value;

      if (!agent) {
        return err(new Error("No authenticated session found for curator"));
      }

      let collectionRecord: PublishedRecordId | undefined;
      const publishedLinks: Array<{
        cardId: string;
        linkRecord: PublishedRecordId;
      }> = [];

      // 1. Publish or update the collection record if needed
      if (!collection.publishedRecordId) {
        // Create new collection record
        const collectionRecordDTO =
          CollectionMapper.toCreateRecordDTO(collection);

        const createResult = await agent.com.atproto.repo.createRecord({
          repo: curatorDid.value,
          collection: this.COLLECTION_COLLECTION,
          record: collectionRecordDTO,
        });

        collectionRecord = PublishedRecordId.create({
          uri: createResult.data.uri,
          cid: createResult.data.cid,
        });
      } else {
        // Update existing collection record
        const collectionRecordDTO =
          CollectionMapper.toCreateRecordDTO(collection);
        const publishedRecordId = collection.publishedRecordId.getValue();
        const strongRef = new StrongRef(publishedRecordId);
        const atUri = strongRef.atUri;
        const rkey = atUri.rkey;

        await agent.com.atproto.repo.putRecord({
          repo: curatorDid.value,
          collection: this.COLLECTION_COLLECTION,
          rkey: rkey,
          record: collectionRecordDTO,
        });

        collectionRecord = collection.publishedRecordId;
      }

      // 2. Publish unpublished card links
      const unpublishedLinks = collection.getUnpublishedCardLinks();

      for (const link of unpublishedLinks) {
        const linkPublishResult = await this.publishCardInCollectionLink(
          link,
          collectionRecord,
          agent,
          curatorDid.value
        );

        if (linkPublishResult.isOk()) {
          publishedLinks.push({
            cardId: link.cardId.getStringValue(),
            linkRecord: linkPublishResult.value,
          });
        } else {
          // Log error but continue with other links
          console.error(
            `Failed to publish link for card ${link.cardId.getStringValue()}: ${linkPublishResult.error.message}`
          );
        }
      }

      return ok({
        collectionRecord,
        publishedLinks,
      });
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * Publishes a single card-in-collection link
   */
  private async publishCardInCollectionLink(
    collectionLink: any, // CollectionLink type
    collectionPublishedRecordId: PublishedRecordId,
    agent: any,
    repo: string
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      // Get the card's published record ID
      // Note: This assumes the card is already published
      // In practice, you'd need to look up the card's published record ID
      const cardPublishedRecordId = collectionLink.getCardPublishedRecordId();

      if (!cardPublishedRecordId) {
        return err(
          new Error("Card must be published before adding to collection")
        );
      }

      const linkRecordDTO = CollectionLinkMapper.toCreateRecordDTO(
        collectionLink,
        collectionPublishedRecordId.getValue(),
        cardPublishedRecordId.getValue()
      );

      const createResult = await agent.com.atproto.repo.createRecord({
        repo,
        collection: this.COLLECTION_LINK_COLLECTION,
        record: linkRecordDTO,
      });

      return ok(
        PublishedRecordId.create({
          uri: createResult.data.uri,
          cid: createResult.data.cid,
        })
      );
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * Unpublishes (deletes) a Collection record and all its links
   */
  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    try {
      const publishedRecordId = recordId.getValue();
      const strongRef = new StrongRef(publishedRecordId);
      const atUri = strongRef.atUri;
      const curatorDid = atUri.did;
      const repo = atUri.did.toString();
      const rkey = atUri.rkey;

      // Get an authenticated agent for this curator
      const agentResult =
        await this.agentService.getAuthenticatedAgent(curatorDid);

      if (agentResult.isErr()) {
        return err(
          new Error(`Authentication error: ${agentResult.error.message}`)
        );
      }

      const agent = agentResult.value;

      if (!agent) {
        return err(new Error("No authenticated session found for curator"));
      }

      // TODO: Also delete all collection link records that reference this collection
      // This would require querying for all links that reference this collection
      // and deleting them individually

      await agent.com.atproto.repo.deleteRecord({
        repo,
        collection: this.COLLECTION_COLLECTION,
        rkey,
      });

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }
}
