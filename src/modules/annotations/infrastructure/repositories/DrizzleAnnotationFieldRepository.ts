import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationFieldRepository } from "../../application/repositories/IAnnotationFieldRepository";
import { AnnotationField } from "../../domain/AnnotationField";
import {
  AnnotationFieldId,
  PublishedRecordId,
} from "../../domain/value-objects";
import { annotationFields } from "./schema/annotationFieldSchema";
import { AnnotationFieldMapper } from "./mappers/AnnotationFieldMapper";

export class DrizzleAnnotationFieldRepository
  implements IAnnotationFieldRepository
{
  constructor(private db: PostgresJsDatabase) {}

  async findById(id: AnnotationFieldId): Promise<AnnotationField | null> {
    const fieldId = id.getStringValue();

    const result = await this.db
      .select()
      .from(annotationFields)
      .where(eq(annotationFields.id, fieldId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (!result[0]) {
      throw new Error("Field not found");
    }

    const fieldDTO = {
      id: result[0].id,
      curatorId: result[0].curatorId,
      name: result[0].name,
      description: result[0].description,
      definitionType: result[0].definitionType,
      definitionData: result[0].definitionData,
      createdAt: result[0].createdAt,
      publishedRecordId: result[0].publishedRecordId,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async findByPublishedRecordId(
    recordId: PublishedRecordId
  ): Promise<AnnotationField | null> {
    const publishedId = recordId.getValue();

    const result = await this.db
      .select()
      .from(annotationFields)
      .where(eq(annotationFields.publishedRecordId, publishedId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (!result[0]) {
      throw new Error("Field not found");
    }

    const fieldDTO = {
      id: result[0].id,
      curatorId: result[0].curatorId,
      name: result[0].name,
      description: result[0].description,
      definitionType: result[0].definitionType,
      definitionData: result[0].definitionData,
      createdAt: result[0].createdAt,
      publishedRecordId: result[0].publishedRecordId,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async findByName(name: string): Promise<AnnotationField | null> {
    const result = await this.db
      .select()
      .from(annotationFields)
      .where(eq(annotationFields.name, name))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (!result[0]) {
      throw new Error("Field not found");
    }

    const fieldDTO = {
      id: result[0].id,
      curatorId: result[0].curatorId,
      name: result[0].name,
      description: result[0].description,
      definitionType: result[0].definitionType,
      definitionData: result[0].definitionData,
      createdAt: result[0].createdAt,
      publishedRecordId: result[0].publishedRecordId,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async save(field: AnnotationField): Promise<void> {
    const data = AnnotationFieldMapper.toPersistence(field);

    await this.db
      .insert(annotationFields)
      .values({
        id: data.id,
        curatorId: data.curatorId,
        name: data.name,
        description: data.description,
        definitionType: data.definitionType,
        definitionData: data.definitionData,
        createdAt: data.createdAt,
        publishedRecordId: data.publishedRecordId,
      })
      .onConflictDoUpdate({
        target: annotationFields.id,
        set: {
          curatorId: data.curatorId,
          name: data.name,
          description: data.description,
          definitionType: data.definitionType,
          definitionData: data.definitionData,
          publishedRecordId: data.publishedRecordId,
        },
      });
  }

  async delete(id: AnnotationFieldId): Promise<void> {
    const fieldId = id.getStringValue();
    await this.db
      .delete(annotationFields)
      .where(eq(annotationFields.id, fieldId));
  }
}
