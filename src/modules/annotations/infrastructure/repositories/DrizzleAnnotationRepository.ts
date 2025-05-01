import { eq, sql, and, inArray } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationRepository } from "../../application/repositories/IAnnotationRepository";
import { Annotation } from "../../domain/aggregates/Annotation";
import { TID } from "../../../../atproto/domain/value-objects/TID";
import { URI } from "../../domain/value-objects/URI";
import { annotations, annotationToTemplates } from "./schema/annotationSchema";
import { AnnotationMapper } from "./mappers/AnnotationMapper";
import { UniqueEntityID } from "../../../../shared/domain/UniqueEntityID";
import { AnnotationTemplateId } from "../../domain/value-objects";

export class DrizzleAnnotationRepository implements IAnnotationRepository {
  constructor(private db: PostgresJsDatabase) {}

  async findById(id: TID): Promise<Annotation | null> {
    const annotationId = id.toString();

    const annotationResult = await this.db
      .select()
      .from(annotations)
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
    const annotation = annotationResult[0];
    if (!annotation) {
      throw new Error("Annotation not found");
    }

    const annotationDTO = {
      id: annotation.id,
      curatorId: annotation.curatorId,
      url: annotation.url,
      annotationFieldId: annotation.annotationFieldId,
      valueType: annotation.valueType,
      valueData: annotation.valueData,
      note: annotation.note,
      createdAt: annotation.createdAt,
      publishedRecordId: annotation.publishedRecordId,
      templateIds: templateIds.length > 0 ? templateIds : undefined,
    };

    const domainResult = AnnotationMapper.toDomain(annotationDTO);
    if (domainResult.isErr()) {
      console.error("Error mapping annotation to domain:", domainResult.error);
      return null;
    }
    return domainResult.value;
  }

  async findByUri(uri: string): Promise<Annotation | null> {
    const annotationResult = await this.db
      .select()
      .from(annotations)
      .where(eq(annotations.publishedRecordId, uri))
      .limit(1);

    if (annotationResult.length === 0) {
      return null;
    }

    // Use the findById method to get the complete annotation with template links
    const annotation = annotationResult[0];
    if (!annotation) {
      throw new Error("Annotation not found");
    }

    return this.findById(TID.fromString(annotation.id));
  }

  async findByUrl(url: URI): Promise<Annotation[]> {
    const urlString = url.value;

    const annotationResults = await this.db
      .select()
      .from(annotations)
      .where(eq(annotations.url, urlString));

    if (annotationResults.length === 0) {
      return [];
    }

    // Get all annotation IDs
    const annotationIds = annotationResults.map((a) => a.id);

    // Fetch all template links for these annotations in a single query
    const templateLinks = await this.db
      .select()
      .from(annotationToTemplates)
      .where(inArray(annotationToTemplates.annotationId, annotationIds));

    // Group template IDs by annotation ID
    const templateIdsByAnnotation = templateLinks.reduce((acc, link) => {
      if (!acc[link.annotationId]) {
        acc[link.annotationId] = [];
      }
      acc[link.annotationId].push(link.templateId);
      return acc;
    }, {} as Record<string, string[]>);

    // Map each annotation to domain object
    const domainAnnotations: Annotation[] = [];
    for (const annotation of annotationResults) {
      const annotationDTO = {
        id: annotation.id,
        curatorId: annotation.curatorId,
        url: annotation.url,
        annotationFieldId: annotation.annotationFieldId,
        valueType: annotation.valueType,
        valueData: annotation.valueData,
        note: annotation.note,
        createdAt: annotation.createdAt,
        publishedRecordId: annotation.publishedRecordId,
        templateIds: templateIdsByAnnotation[annotation.id] || undefined,
      };

      const domainResult = AnnotationMapper.toDomain(annotationDTO);
      if (domainResult.isErr()) {
        console.error("Error mapping annotation to domain:", domainResult.error);
        continue;
      }
      domainAnnotations.push(domainResult.value);
    }

    return domainAnnotations;
  }

  async save(annotation: Annotation): Promise<void> {
    const { annotation: annotationData, templateLinks } =
      AnnotationMapper.toPersistence(annotation);

    // Use a transaction to ensure atomicity
    await this.db.transaction(async (tx) => {
      // Upsert the annotation
      await tx
        .insert(annotations)
        .values(annotationData)
        .onConflictDoUpdate({
          target: annotations.id,
          set: {
            curatorId: annotationData.curatorId,
            url: annotationData.url,
            annotationFieldId: annotationData.annotationFieldId,
            valueType: annotationData.valueType,
            valueData: annotationData.valueData,
            note: annotationData.note,
            publishedRecordId: annotationData.publishedRecordId,
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

  async delete(id: TID): Promise<void> {
    const annotationId = id.toString();

    // The foreign key constraint with ON DELETE CASCADE will automatically
    // delete related records in the annotationToTemplates table
    await this.db
      .delete(annotations)
      .where(eq(annotations.id, annotationId));
  }
}
