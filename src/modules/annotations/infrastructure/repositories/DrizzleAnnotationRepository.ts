import { eq, inArray, and } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationRepository } from "../../application/repositories/IAnnotationRepository";
import { IAnnotationFieldRepository } from "../../application/repositories/IAnnotationFieldRepository";
import { Annotation } from "../../domain/aggregates/Annotation";
import {
  AnnotationId,
  PublishedRecordId,
  AnnotationFieldId,
} from "../../domain/value-objects";
import { URI } from "../../domain/value-objects/URI";
import { annotations, annotationToTemplates } from "./schema/annotation.sql";
import { publishedRecords } from "./schema/publishedRecord.sql";
import { AnnotationDTO, AnnotationMapper } from "./mappers/AnnotationMapper";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { AnnotationFieldMapper } from "./mappers/AnnotationFieldMapper";

export class DrizzleAnnotationRepository implements IAnnotationRepository {
  constructor(
    private db: PostgresJsDatabase,
    private annotationFieldRepository: IAnnotationFieldRepository
  ) {}

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

    // Fetch the annotation field
    const fieldId = AnnotationFieldId.create(
      new UniqueEntityID(annotation.annotationFieldId)
    );
    if (fieldId.isErr()) {
      console.error("Error creating field ID:", fieldId.error);
      return null;
    }

    const annotationField = await this.annotationFieldRepository.findById(
      fieldId.value
    );
    if (!annotationField) {
      console.error(
        `Annotation field with ID ${annotation.annotationFieldId} not found`
      );
      return null;
    }

    const annotationFieldPersistence =
      AnnotationFieldMapper.toPersistence(annotationField);

    const annotationDTO: AnnotationDTO = {
      id: annotation.id,
      curatorId: annotation.curatorId,
      url: annotation.url,
      annotationFieldId: annotation.annotationFieldId,
      annotationField: annotationFieldPersistence,
      valueType: annotation.valueType,
      valueData: annotation.valueData,
      note: annotation.note || undefined,
      createdAt: annotation.createdAt,
      publishedRecordId: publishedRecord?.id || null,
      publishedRecord: publishedRecord || undefined,
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
    recordId: PublishedRecordId
  ): Promise<Annotation | null> {
    const publishedIdProps = recordId.getValue();

    // Find the published record ID with matching URI and CID
    const publishedRecordResult = await this.db
      .select()
      .from(publishedRecords)
      .where(
        and(
          eq(publishedRecords.uri, publishedIdProps.uri),
          eq(publishedRecords.cid, publishedIdProps.cid)
        )
      )
      .limit(1);

    if (publishedRecordResult.length === 0 || !publishedRecordResult[0]) {
      return null;
    }

    const publishedRecordDbId = publishedRecordResult[0].id;

    // Find the annotation with this published record ID
    const annotationResult = await this.db
      .select({
        annotation: annotations,
        publishedRecord: publishedRecords,
      })
      .from(annotations)
      .innerJoin(
        publishedRecords,
        eq(annotations.publishedRecordId, publishedRecords.id)
      )
      .where(eq(publishedRecords.id, publishedRecordDbId))
      .limit(1);

    if (annotationResult.length === 0 || !annotationResult[0]) {
      return null;
    }

    // Fetch associated template IDs
    const templateLinks = await this.db
      .select()
      .from(annotationToTemplates)
      .where(
        eq(
          annotationToTemplates.annotationId,
          annotationResult[0].annotation.id
        )
      );

    const templateIds = templateLinks.map((link) => link.templateId);

    // Map to domain object
    const result = annotationResult[0];
    if (!result || !result.annotation) {
      throw new Error("Annotation not found");
    }

    const annotation = result.annotation;
    const publishedRecord = result.publishedRecord;

    // Fetch the annotation field
    const fieldId = AnnotationFieldId.create(
      new UniqueEntityID(annotation.annotationFieldId)
    );
    if (fieldId.isErr()) {
      console.error("Error creating field ID:", fieldId.error);
      return null;
    }

    const annotationField = await this.annotationFieldRepository.findById(
      fieldId.value
    );
    if (!annotationField) {
      console.error(
        `Annotation field with ID ${annotation.annotationFieldId} not found`
      );
      return null;
    }

    const annotationFieldPersistence =
      AnnotationFieldMapper.toPersistence(annotationField);

    const annotationDTO: AnnotationDTO = {
      id: annotation.id,
      curatorId: annotation.curatorId,
      url: annotation.url,
      annotationFieldId: annotation.annotationFieldId,
      annotationField: annotationFieldPersistence,
      valueType: annotation.valueType,
      valueData: annotation.valueData,
      note: annotation.note || undefined,
      createdAt: annotation.createdAt,
      publishedRecordId: publishedRecord?.id || null,
      publishedRecord: publishedRecord || undefined,
      templateIds: templateIds.length > 0 ? templateIds : undefined,
    };

    const domainResult = AnnotationMapper.toDomain(annotationDTO);
    if (domainResult.isErr()) {
      console.error("Error mapping annotation to domain:", domainResult.error);
      return null;
    }
    return domainResult.value;
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

      // Fetch the annotation field
      const fieldId = AnnotationFieldId.create(
        new UniqueEntityID(annotation.annotationFieldId)
      );
      if (fieldId.isErr()) {
        console.error("Error creating field ID:", fieldId.error);
        continue;
      }

      const annotationField = await this.annotationFieldRepository.findById(
        fieldId.value
      );
      if (!annotationField) {
        console.error(
          `Annotation field with ID ${annotation.annotationFieldId} not found`
        );
        continue;
      }

      const annotationFieldPersistence =
        AnnotationFieldMapper.toPersistence(annotationField);

      const annotationDTO: AnnotationDTO = {
        id: annotation.id,
        curatorId: annotation.curatorId,
        url: annotation.url,
        annotationFieldId: annotation.annotationFieldId,
        annotationField: annotationFieldPersistence,
        valueType: annotation.valueType,
        valueData: annotation.valueData,
        note: annotation.note || undefined,
        createdAt: annotation.createdAt,
        publishedRecordId: publishedRecord?.id || null,
        publishedRecord: publishedRecord || undefined,
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
        // Insert the published record - we don't update existing records
        // since we want to keep track of all CIDs
        const publishedRecordResult = await tx
          .insert(publishedRecords)
          .values({
            id: publishedRecord.id,
            uri: publishedRecord.uri,
            cid: publishedRecord.cid,
            recordedAt: publishedRecord.recordedAt || new Date(),
          })
          .onConflictDoNothing({
            target: [publishedRecords.uri, publishedRecords.cid],
          })
          .returning({ id: publishedRecords.id });

        // If we didn't insert (because it already exists), find the existing record
        if (publishedRecordResult.length === 0) {
          const existingRecord = await tx
            .select()
            .from(publishedRecords)
            .where(
              and(
                eq(publishedRecords.uri, publishedRecord.uri),
                eq(publishedRecords.cid, publishedRecord.cid)
              )
            )
            .limit(1);

          if (existingRecord.length > 0) {
            publishedRecordId = existingRecord[0]!.id;
          }
        } else {
          publishedRecordId = publishedRecordResult[0]!.id;
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
