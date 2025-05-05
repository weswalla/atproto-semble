import { IAnnotationTemplatePublisher } from "src/modules/annotations/application/ports/IAnnotationTemplatePublisher";
import { AnnotationTemplate } from "src/modules/annotations/domain/aggregates/AnnotationTemplate";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import { AtpAgent } from "@atproto/api";
import { AnnotationTemplateMapper } from "./AnnotationTemplateMapper";
import { StrongRef } from "../domain";

export class ATProtoAnnotationTemplatePublisher
  implements IAnnotationTemplatePublisher
{
  private agent: AtpAgent;
  private readonly COLLECTION = "app.annos.annotationTemplate";

  constructor(agent: AtpAgent) {
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
        return err(
          new Error("All fields must be published before publishing a template")
        );
      }

      const record = AnnotationTemplateMapper.toCreateRecordDTO(template);
      const curatorDid = template.curatorId.value;

      // If the template is already published, update it
      if (template.publishedRecordId) {
        const publishedRecordId = template.publishedRecordId.getValue();
        const strongRef = new StrongRef(publishedRecordId);
        const atUri = strongRef.atUri;
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
   * Unpublishes (deletes) an AnnotationTemplate from the AT Protocol
   */
  async unpublish(
    recordId: PublishedRecordId
  ): Promise<Result<void, UseCaseError>> {
    try {
      const publishedRecordId = recordId.getValue();
      const strongRef = new StrongRef(publishedRecordId);
      const atUri = strongRef.atUri;
      const repo = atUri.did.toString();
      const rkey = atUri.rkey;

      await this.agent.com.atproto.repo.deleteRecord({
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
