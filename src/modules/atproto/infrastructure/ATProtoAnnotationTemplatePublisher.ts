import { IAnnotationTemplatePublisher } from "src/modules/annotations/application/ports/IAnnotationTemplatePublisher";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates/AnnotationTemplate";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { BskyAgent } from "@atproto/api";
import { AnnotationTemplateMapper } from "./AnnotationTemplateMapper";
import { ATUri } from "../domain/ATUri";

export class ATProtoAnnotationTemplatePublisher
  implements IAnnotationTemplatePublisher {
  
  private agent: BskyAgent;
  private readonly COLLECTION = "app.annos.annotationTemplate";

  constructor(agent: BskyAgent) {
    this.agent = agent;
  }

  /**
   * Publishes an AnnotationTemplate to the AT Protocol
   * @throws Error if any fields in the template are not published
   */
  async publish(
    template: AnnotationTemplate
  ): Promise<Result<PublishedRecordId, UseCaseError>> {
    try {
      // Check if all fields are published
      if (template.hasUnpublishedFields()) {
        return err(new Error("All fields must be published before publishing a template"));
      }

      const record = AnnotationTemplateMapper.toCreateRecordDTO(template);
      const curatorDid = template.curatorId.value;

      // If the template is already published, update it
      if (template.publishedRecordId) {
        const uri = template.publishedRecordId.getValue();
        const atUri = new ATUri(uri);
        const rkey = atUri.rkey;

        await this.agent.com.atproto.repo.putRecord({
          repo: curatorDid,
          collection: this.COLLECTION,
          rkey: rkey,
          record,
        });

        return ok(template.publishedRecordId);
      } 
      // Otherwise create a new record
      else {
        const createResult = await this.agent.com.atproto.repo.createRecord({
          repo: curatorDid,
          collection: this.COLLECTION,
          record,
        });

        return ok(PublishedRecordId.create(createResult.data.uri));
      }
    } catch (error) {
      return err(new Error(error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Unpublishes (deletes) an AnnotationTemplate from the AT Protocol
   */
  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    try {
      const uri = recordId.getValue();
      const atUri = new ATUri(uri);
      const repo = atUri.did.toString();
      const rkey = atUri.rkey;

      await this.agent.com.atproto.repo.deleteRecord({
        repo,
        collection: this.COLLECTION,
        rkey,
      });

      return ok(undefined);
    } catch (error) {
      return err(new Error(error instanceof Error ? error.message : String(error)));
    }
  }
}
