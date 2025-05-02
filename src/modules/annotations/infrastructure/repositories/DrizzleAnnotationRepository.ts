import { eq, inArray } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationRepository } from "../../application/repositories/IAnnotationRepository";
import { Annotation } from "../../domain/aggregates/Annotation";
import { AnnotationId, PublishedRecordId } from "../../domain/value-objects";
import { URI } from "../../domain/value-objects/URI";
import { annotations, annotationToTemplates } from "./schema/annotationSchema";
import { publishedRecords } from "./schema/publishedRecordSchema";
import { AnnotationDTO, AnnotationMapper } from "./mappers/AnnotationMapper";

export class DrizzleAnnotationRepository implements IAnnotationRepository {
  constructor(private db: PostgresJsDatabase) {}

  async findById(id: AnnotationId): Promise<Annotation | null> {
    const annotationId = id.getStringValue();

    // Join with publishedRecords to get URI and CID
    const annotationResult = await this.db
      .select({
        annotation: annotations,
        publishedRecord: publishedRecords,
      })
      .from(annotations)
      .leftJoin(
        publishedRecords,
        eq(annotations.publishedRecordId, publishedRecords.id)
      )
      .where(eq(annotations.id, annotationId))
      .limit(1);

    if (annotationResult.length === 0) {
      return null;
    }

    // Fetch associated template IDs
    const templateLinks = await this.db
      .select()
      .from(annotationToTemplates)
      .where(eq(annotationToTemplates.annotationId, annotationId));

    const templateIds = templateLinks.map((link) => link.templateId);

    // Map to domain object
    const result = annotationResult[0];
    if (!result || !result.annotation) {
      throw new Error("Annotation not found");
    }

    const annotation = result.annotation;
    const publishedRecord = result.publishedRecord;

    const annotationDTO: AnnotationDTO = {
      id: annotation.id,
      curatorId: annotation.curatorId,
      url: annotation.url,
      annotationFieldId: annotation.annotationFieldId,
      valueType: annotation.valueType,
      valueData: annotation.valueData,
      note: annotation.note || undefined,
      createdAt: annotation.createdAt,
      publishedRecordId: publishedRecord
        ? { uri: publishedRecord.uri, cid: publishedRecord.cid }
        : undefined,
      templateIds: templateIds.length > 0 ? templateIds : undefined,
    };

    const domainResult = AnnotationMapper.toDomain(annotationDTO);
    if (domainResult.isErr()) {
      console.error("Error mapping annotation to domain:", domainResult.error);
      return null;
    }
    return domainResult.value;
  }

  async findByPublishedRecordId(
    publishedRecordId: PublishedRecordId
  ): Promise<Annotation | null> {
    // Find the published record ID first
    const publishedRecordResult = await this.db
      .select()
      .from(publishedRecords)
      .where(eq(publishedRecords.uri, uri))
      .limit(1);

    if (publishedRecordResult.length === 0 || !publishedRecordResult[0]) {
      return null;
    }

    const publishedRecordId = publishedRecordResult[0].id;

    // Find the annotation with this published record ID
    const annotationResult = await this.db
      .select()
      .from(annotations)
      .where(eq(annotations.publishedRecordId, publishedRecordId))
      .limit(1);

    if (annotationResult.length === 0 || !annotationResult[0]) {
      return null;
    }

    // Use the findById method to get the complete annotation with template links
    return this.findById(
      AnnotationId.createFromString(annotationResult[0].id).unwrap()
    );
  }

  async findByUrl(url: URI): Promise<Annotation[]> {
    const urlString = url.value;

    // Join with publishedRecords to get URI and CID
    const annotationResults = await this.db
      .select({
        annotation: annotations,
        publishedRecord: publishedRecords,
      })
      .from(annotations)
      .leftJoin(
        publishedRecords,
        eq(annotations.publishedRecordId, publishedRecords.id)
      )
      .where(eq(annotations.url, urlString));

    if (annotationResults.length === 0) {
      return [];
    }

    // Get all annotation IDs
    const annotationIds = annotationResults.map(
      (result) => result.annotation.id
    );

    // Fetch all template links for these annotations in a single query
    const templateLinks = await this.db
      .select()
      .from(annotationToTemplates)
      .where(inArray(annotationToTemplates.annotationId, annotationIds));

    // Group template IDs by annotation ID
    const templateIdsByAnnotation = templateLinks.reduce(
      (acc, link) => {
        if (!acc[link.annotationId]) {
          acc[link.annotationId] = [];
        }
        acc[link.annotationId]!.push(link.templateId);
        return acc;
      },
      {} as Record<string, string[]>
    );

    // Map each annotation to domain object
    const domainAnnotations: Annotation[] = [];
    for (const result of annotationResults) {
      const annotation = result.annotation;
      const publishedRecord = result.publishedRecord;

      const annotationDTO: AnnotationDTO = {
        id: annotation.id,
        curatorId: annotation.curatorId,
        url: annotation.url,
        annotationFieldId: annotation.annotationFieldId,
        valueType: annotation.valueType,
        valueData: annotation.valueData,
        note: annotation.note || undefined,
        createdAt: annotation.createdAt,
        publishedRecordId: publishedRecord
          ? { uri: publishedRecord.uri, cid: publishedRecord.cid }
          : undefined,
        templateIds: templateIdsByAnnotation[annotation.id] || undefined,
      };

      const domainResult = AnnotationMapper.toDomain(annotationDTO);
      if (domainResult.isErr()) {
        console.error(
          "Error mapping annotation to domain:",
          domainResult.error
        );
        continue;
      }
      domainAnnotations.push(domainResult.value);
    }

    return domainAnnotations;
  }

  async save(annotation: Annotation): Promise<void> {
    const {
      annotation: annotationData,
      publishedRecord,
      templateLinks,
    } = AnnotationMapper.toPersistence(annotation);

    // Use a transaction to ensure atomicity
    await this.db.transaction(async (tx) => {
      // Handle published record if it exists
      let publishedRecordId: string | undefined = undefined;

      if (publishedRecord) {
        // Insert or update the published record
        const publishedRecordResult = await tx
          .insert(publishedRecords)
          .values({
            id: publishedRecord.id,
            uri: publishedRecord.uri,
            cid: publishedRecord.cid,
          })
          .onConflictDoUpdate({
            target: [publishedRecords.uri],
            set: {
              cid: publishedRecord.cid,
            },
          })
          .returning({ id: publishedRecords.id });

        if (publishedRecordResult.length > 0) {
          publishedRecordId = publishedRecordResult[0].id;
        }
      }

      // Upsert the annotation
      await tx
        .insert(annotations)
        .values({
          ...annotationData,
          publishedRecordId: publishedRecordId,
        })
        .onConflictDoUpdate({
          target: annotations.id,
          set: {
            curatorId: annotationData.curatorId,
            url: annotationData.url,
            annotationFieldId: annotationData.annotationFieldId,
            valueType: annotationData.valueType,
            valueData: annotationData.valueData,
            note: annotationData.note,
            publishedRecordId: publishedRecordId,
          },
        });

      // Delete existing template links
      await tx
        .delete(annotationToTemplates)
        .where(eq(annotationToTemplates.annotationId, annotationData.id));

      // Insert new template links if they exist
      if (templateLinks && templateLinks.length > 0) {
        await tx.insert(annotationToTemplates).values(templateLinks);
      }
    });
  }

  async delete(id: AnnotationId): Promise<void> {
    const annotationId = id.getStringValue();

    // The foreign key constraint with ON DELETE CASCADE will automatically
    // delete related records in the annotationToTemplates table
    await this.db.delete(annotations).where(eq(annotations.id, annotationId));
  }
}
