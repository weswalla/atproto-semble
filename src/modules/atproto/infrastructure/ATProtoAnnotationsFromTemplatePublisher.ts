import { AtpAgent } from "@atproto/api";
import { IAnnotationsFromTemplatePublisher, PublishedAnnotationsFromTemplateResult } from "src/modules/annotations/application/ports/IAnnotationsFromTemplatePublisher";
import { AnnotationsFromTemplate } from "src/modules/annotations/domain/aggregates/AnnotationsFromTemplate";
import { AnnotationId, PublishedRecordId } from "src/modules/annotations/domain/value-objects";
import { Result, ok, err } from "src/shared/core/Result";
import { UseCaseError } from "src/shared/core/UseCaseError";
import { AnnotationMapper } from "./AnnotationMapper";
import { StrongRef } from "../domain";

export class ATProtoAnnotationsFromTemplatePublisher implements IAnnotationsFromTemplatePublisher {
  private agent: AtpAgent;
  private readonly COLLECTION = "app.annos.annotation";

  constructor(agent: AtpAgent) {
    this.agent = agent;
  }

  /**
   * Publishes multiple annotations from a template to the AT Protocol in a single transaction
   */
  async publish(
    annotationsFromTemplate: AnnotationsFromTemplate
  ): Promise<Result<PublishedAnnotationsFromTemplateResult, UseCaseError>> {
    try {
      const annotations = annotationsFromTemplate.annotations;
      const curatorDid = annotations[0]?.curatorId.value;
      
      if (!curatorDid) {
        return err(new Error("No curator DID found in annotations"));
      }

      // Prepare writes for all annotations
      const writes = [];
      const tempRkeys = new Map<string, string>();

      // First, prepare all the create operations
      for (const annotation of annotations) {
        const record = AnnotationMapper.toCreateRecordDTO(annotation);
        const annotationId = annotation.annotationId.getStringValue();
        
        // Generate a deterministic rkey based on the annotation ID
        // In a real implementation, you might want to use a more sophisticated approach
        const rkey = `annotation-${annotationId}`;
        tempRkeys.set(annotationId, rkey);
        
        // Create the write operation
        writes.push({
          $type: "com.atproto.repo.applyWrites#create",
          collection: this.COLLECTION,
          rkey,
          value: record
        });
      }

      // Apply all writes in a single transaction
      const result = await this.agent.com.atproto.repo.applyWrites({
        repo: curatorDid,
        writes,
        validate: true
      });

      // Create a map of annotation IDs to published record IDs
      const publishedRecordIds = new Map<string, PublishedRecordId>();
      
      // For each annotation, create a PublishedRecordId
      for (const annotation of annotations) {
        const annotationId = annotation.annotationId.getStringValue();
        const rkey = tempRkeys.get(annotationId);
        
        if (!rkey) {
          return err(new Error(`No rkey found for annotation ${annotationId}`));
        }
        
        // Construct the AT URI for this record
        const uri = `at://${curatorDid}/${this.COLLECTION}/${rkey}`;
        
        // In a real implementation, you would get the CID from the response
        // For now, we'll use a placeholder
        const cid = "placeholder-cid";
        
        // Create the PublishedRecordId
        const publishedRecordId = PublishedRecordId.create({
          uri,
          cid
        });
        
        // Add to the map
        publishedRecordIds.set(annotationId, publishedRecordId);
      }

      return ok(publishedRecordIds);
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }

  /**
   * Unpublishes (deletes) multiple Annotation records from the AT Protocol
   */
  async unpublish(
    recordIds: PublishedRecordId[]
  ): Promise<Result<void, UseCaseError>> {
    try {
      // Group records by repo (curator DID)
      const recordsByRepo = new Map<string, { rkey: string; uri: string }[]>();
      
      for (const recordId of recordIds) {
        const publishedRecordId = recordId.getValue();
        const strongRef = new StrongRef(publishedRecordId);
        const atUri = strongRef.atUri;
        const repo = atUri.did.toString();
        const rkey = atUri.rkey;
        
        if (!recordsByRepo.has(repo)) {
          recordsByRepo.set(repo, []);
        }
        
        recordsByRepo.get(repo)?.push({ rkey, uri: publishedRecordId.uri });
      }
      
      // For each repo, create a batch delete operation
      for (const [repo, records] of recordsByRepo.entries()) {
        const writes = records.map(record => ({
          $type: "com.atproto.repo.applyWrites#delete",
          collection: this.COLLECTION,
          rkey: record.rkey
        }));
        
        // Apply all deletes for this repo in a single transaction
        await this.agent.com.atproto.repo.applyWrites({
          repo,
          writes,
          validate: true
        });
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new Error(error instanceof Error ? error.message : String(error))
      );
    }
  }
}
