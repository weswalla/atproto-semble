import { ICardPublisher } from "src/modules/cards/application/ports/ICardPublisher";
import { Card } from "src/modules/cards/domain/Card";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { PublishedRecordId } from "src/modules/cards/domain/value-objects/PublishedRecordId";
import { CardMapper } from "./CardMapper";
import { StrongRef } from "../domain";
import { IAgentService } from "../application/IAgentService";
import { DID } from "../domain/DID";

export class ATProtoCardPublisher implements ICardPublisher {
  private readonly COLLECTION = "app.cards.card";

  constructor(private readonly agentService: IAgentService) {}

  /**
   * Publishes a Card to the AT Protocol
   */
  async publish(card: Card): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      const record = CardMapper.toCreateRecordDTO(card);
      const curatorDid = new DID(card.curatorId.value);

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

      // If the card is already published, update it
      if (card.publishedRecordId) {
        const publishedRecordId = card.publishedRecordId.getValue();
        const strongRef = new StrongRef(publishedRecordId);
        const atUri = strongRef.atUri;
        const rkey = atUri.rkey;

        await agent.com.atproto.repo.putRecord({
          repo: curatorDid.value,
          collection: this.COLLECTION,
          rkey: rkey,
          record,
        });

        return ok(card.publishedRecordId);
      }
      // Otherwise create a new record
      else {
        const createResult = await agent.com.atproto.repo.createRecord({
          repo: curatorDid.value,
          collection: this.COLLECTION,
          record,
        });

        return ok(
          PublishedRecordId.create({
            uri: createResult.data.uri,
            cid: createResult.data.cid,
          })
        );
      }
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * Unpublishes (deletes) a Card from the AT Protocol
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

      await agent.com.atproto.repo.deleteRecord({
        repo,
        collection: this.COLLECTION,
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
