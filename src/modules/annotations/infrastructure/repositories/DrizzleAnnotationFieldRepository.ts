import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationFieldRepository } from "../../application/repositories/IAnnotationFieldRepository";
import { AnnotationField } from "../../domain/AnnotationField";
import {
  AnnotationFieldId,
  PublishedRecordId,
} from "../../domain/value-objects";
import { annotationFields } from "./schema/annotationFieldSchema";
import { publishedRecords } from "./schema/publishedRecordSchema";
import { AnnotationFieldMapper } from "./mappers/AnnotationFieldMapper";

export class DrizzleAnnotationFieldRepository
  implements IAnnotationFieldRepository
{
  constructor(private db: PostgresJsDatabase) {}

  async findById(id: AnnotationFieldId): Promise<AnnotationField | null> {
    const fieldId = id.getStringValue();

    const result = await this.db
      .select({
        field: annotationFields,
        publishedRecord: publishedRecords,
      })
      .from(annotationFields)
      .leftJoin(
        publishedRecords,
        eq(annotationFields.publishedRecordId, publishedRecords.id)
      )
      .where(eq(annotationFields.id, fieldId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (!result[0]) {
      throw new Error("Field not found");
    }

    const field = result[0].field;
    const publishedRecord = result[0].publishedRecord;

    const fieldDTO = {
      id: field.id,
      curatorId: field.curatorId,
      name: field.name,
      description: field.description,
      definitionType: field.definitionType,
      definitionData: field.definitionData,
      createdAt: field.createdAt,
      publishedRecordId: publishedRecord
        ? { uri: publishedRecord.uri, cid: publishedRecord.cid }
        : undefined,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async findByPublishedRecordId(
    recordId: PublishedRecordId
  ): Promise<AnnotationField | null> {
    const publishedIdProps = recordId.getValue();

    // First find the published record ID
    const publishedRecordResult = await this.db
      .select()
      .from(publishedRecords)
      .where(eq(publishedRecords.uri, publishedIdProps.uri))
      .limit(1);

    if (publishedRecordResult.length === 0 || !publishedRecordResult[0]) {
      return null;
    }

    const publishedRecordId = publishedRecordResult[0].id;

    // Then find the field with this published record ID
    const result = await this.db
      .select({
        field: annotationFields,
        publishedRecord: publishedRecords,
      })
      .from(annotationFields)
      .innerJoin(
        publishedRecords,
        eq(annotationFields.publishedRecordId, publishedRecords.id)
      )
      .where(eq(publishedRecords.id, publishedRecordId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (!result[0]) {
      throw new Error("Field not found");
    }

    const field = result[0].field;
    const publishedRecord = result[0].publishedRecord;

    const fieldDTO = {
      id: field.id,
      curatorId: field.curatorId,
      name: field.name,
      description: field.description,
      definitionType: field.definitionType,
      definitionData: field.definitionData,
      createdAt: field.createdAt,
      publishedRecordId: publishedRecord
        ? { uri: publishedRecord.uri, cid: publishedRecord.cid }
        : undefined,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async findByName(name: string): Promise<AnnotationField | null> {
    const result = await this.db
      .select({
        field: annotationFields,
        publishedRecord: publishedRecords,
      })
      .from(annotationFields)
      .leftJoin(
        publishedRecords,
        eq(annotationFields.publishedRecordId, publishedRecords.id)
      )
      .where(eq(annotationFields.name, name))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (!result[0]) {
      throw new Error("Field not found");
    }

    const field = result[0].field;
    const publishedRecord = result[0].publishedRecord;

    const fieldDTO = {
      id: field.id,
      curatorId: field.curatorId,
      name: field.name,
      description: field.description,
      definitionType: field.definitionType,
      definitionData: field.definitionData,
      createdAt: field.createdAt,
      publishedRecordId: publishedRecord
        ? { uri: publishedRecord.uri, cid: publishedRecord.cid }
        : undefined,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async save(field: AnnotationField): Promise<void> {
    const data = AnnotationFieldMapper.toPersistence(field);

    // Use a transaction to ensure atomicity
    await this.db.transaction(async (tx) => {
      // Handle published record if it exists
      let publishedRecordId: string | undefined = undefined;

      if (data.publishedRecord) {
        // Insert or update the published record
        const publishedRecordResult = await tx
          .insert(publishedRecords)
          .values({
            id: data.publishedRecord.id,
            uri: data.publishedRecord.uri,
            cid: data.publishedRecord.cid,
          })
          .onConflictDoUpdate({
            target: [publishedRecords.uri],
            set: {
              cid: data.publishedRecord.cid,
            },
          })
          .returning({ id: publishedRecords.id });

        if (publishedRecordResult.length > 0) {
          publishedRecordId = publishedRecordResult[0]!.id;
        }
      }

      // Insert or update the annotation field
      await tx
        .insert(annotationFields)
        .values({
          id: data.id,
          curatorId: data.curatorId,
          name: data.name,
          description: data.description,
          definitionType: data.definitionType,
          definitionData: data.definitionData,
          createdAt: data.createdAt,
          publishedRecordId: publishedRecordId,
        })
        .onConflictDoUpdate({
          target: annotationFields.id,
          set: {
            curatorId: data.curatorId,
            name: data.name,
            description: data.description,
            definitionType: data.definitionType,
            definitionData: data.definitionData,
            publishedRecordId: publishedRecordId,
          },
        });
    });
  }

  async delete(id: AnnotationFieldId): Promise<void> {
    const fieldId = id.getStringValue();
    await this.db
      .delete(annotationFields)
      .where(eq(annotationFields.id, fieldId));
  }
}
