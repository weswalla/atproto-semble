import { IAnnotationFieldPublisher } from "src/modules/annotations/application/ports/IAnnotationFieldPublisher";
import { AnnotationField } from "src/modules/annotations/domain/AnnotationField";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { AnnotationFieldMapper } from "../mappers/AnnotationFieldMapper";
import { StrongRef } from "../../domain";
import { IAgentService } from "../../application/IAgentService";
import { DID } from "../../domain/DID";

export class ATProtoAnnotationFieldPublisher
  implements IAnnotationFieldPublisher
{
  private readonly COLLECTION = "app.annos.annotationField";

  constructor(private readonly agentService: IAgentService) {}

  /**
   * Publishes an AnnotationField to the AT Protocol
   */
  async publish(field: AnnotationField): Promise<Result<PublishedRecordId>> {
    try {
      const record = AnnotationFieldMapper.toCreateRecordDTO(field);
      const curatorDid = new DID(field.curatorId.value);

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

      // If the field is already published, update it
      if (field.isPublished()) {
        const publishedRecordId = field.publishedRecordId!.getValue();
        const strongRef = new StrongRef(publishedRecordId);

        const updateResult = await agent.com.atproto.repo.putRecord({
          repo: curatorDid.value,
          collection: this.COLLECTION,
          rkey: strongRef.atUri.rkey,
          record,
        });

        return ok(
          PublishedRecordId.create({
            uri: updateResult.data.uri,
            cid: updateResult.data.cid, // TODO: handle updates
          })
        );
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
      return err(new Error(error as any));
    }
  }

  /**
   * Unpublishes (deletes) an AnnotationField from the AT Protocol
   */
  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    try {
      const strongRef = new StrongRef(recordId.getValue());
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
      return err(new Error(error as any));
    }
  }
}
