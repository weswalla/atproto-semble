import { IAnnotationFieldPublisher } from "src/modules/annotations/application/ports/IAnnotationFieldPublisher";
import { AnnotationField } from "src/modules/annotations/domain/AnnotationField";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { PublishedRecordId } from "src/modules/annotations/domain/value-objects/PublishedRecordId";
import AtpAgent from "@atproto/api";
import { AnnotationFieldMapper } from "./AnnotationFieldMapper";
import { ATUri } from "../domain/ATUri";

export class ATProtoAnnotationFieldPublisher
  implements IAnnotationFieldPublisher
{
  private agent: AtpAgent;
  private readonly COLLECTION = "app.annos.annotationField";

  constructor(agent: AtpAgent) {
    this.agent = agent;
  }

  /**
   * Publishes an AnnotationField to the AT Protocol
   */
  async publish(field: AnnotationField): Promise<Result<PublishedRecordId>> {
    try {
      const record = AnnotationFieldMapper.toCreateRecordDTO(field);
      const curatorDid = field.curatorId.value;

      // If the field is already published, update it
      if (field.isPublished()) {
        const uri = field.publishedRecordId!.getValue();
        const rkey = new ATUri(uri).rkey;

        const updateResult = await this.agent.com.atproto.repo.putRecord({
          repo: curatorDid,
          collection: this.COLLECTION,
          rkey: rkey,
          record,
        });

        return ok(PublishedRecordId.create(uri));
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
      return err(new Error(error as any));
    }
  }
}
