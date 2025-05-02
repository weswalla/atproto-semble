import { eq, and } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationFieldRepository } from "../../application/repositories/IAnnotationFieldRepository";
import { AnnotationField } from "../../domain/AnnotationField";
import {
  AnnotationFieldId,
  PublishedRecordId,
} from "../../domain/value-objects";
import { annotationFields } from "./schema/annotationFieldSchema";
import { publishedRecords } from "./schema/publishedRecordSchema";
import {
  AnnotationFieldMapper,
  AnnotationFieldDTO,
} from "./mappers/AnnotationFieldMapper";

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

    const fieldDTO: AnnotationFieldDTO = {
      id: field.id,
      curatorId: field.curatorId,
      name: field.name,
      description: field.description,
      definitionType: field.definitionType,
      definitionData: field.definitionData,
      createdAt: field.createdAt,
      publishedRecordId: publishedRecord ? publishedRecord.id : null,
      publishedRecord: publishedRecord
        ? {
            id: publishedRecord.id,
            uri: publishedRecord.uri,
            cid: publishedRecord.cid,
            recordedAt: publishedRecord.recordedAt,
          }
        : undefined,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async findByPublishedRecordId(
    recordId: PublishedRecordId
  ): Promise<AnnotationField | null> {
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
      .where(eq(publishedRecords.id, publishedRecordDbId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    if (!result[0]) {
      throw new Error("Field not found");
    }

    const field = result[0].field;
    const publishedRecord = result[0].publishedRecord;

    const fieldDTO: AnnotationFieldDTO = {
      id: field.id,
      curatorId: field.curatorId,
      name: field.name,
      description: field.description,
      definitionType: field.definitionType,
      definitionData: field.definitionData,
      createdAt: field.createdAt,
      publishedRecordId: publishedRecord.id,
      publishedRecord: {
        id: publishedRecord.id,
        uri: publishedRecord.uri,
        cid: publishedRecord.cid,
        recordedAt: publishedRecord.recordedAt,
      },
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

    const fieldDTO: AnnotationFieldDTO = {
      id: field.id,
      curatorId: field.curatorId,
      name: field.name,
      description: field.description,
      definitionType: field.definitionType,
      definitionData: field.definitionData,
      createdAt: field.createdAt,
      publishedRecordId: publishedRecord ? publishedRecord.id : null,
      publishedRecord: publishedRecord
        ? {
            id: publishedRecord.id,
            uri: publishedRecord.uri,
            cid: publishedRecord.cid,
            recordedAt: publishedRecord.recordedAt,
          }
        : undefined,
    };

    const domainResult = AnnotationFieldMapper.toDomain(fieldDTO);
    return domainResult.isOk() ? domainResult.unwrap() : null;
  }

  async save(field: AnnotationField): Promise<void> {
    const fieldDto = AnnotationFieldMapper.toPersistence(field);
    const publishedRecord = fieldDto.publishedRecord;
    const publishedRecordId = fieldDto.publishedRecordId;
    const fieldData = fieldDto;

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

      // Insert or update the annotation field
      await tx
        .insert(annotationFields)
        .values({
          id: fieldData.id,
          curatorId: fieldData.curatorId,
          name: fieldData.name,
          description: fieldData.description,
          definitionType: fieldData.definitionType,
          definitionData: fieldData.definitionData,
          createdAt: fieldData.createdAt,
          publishedRecordId: publishedRecordId,
        })
        .onConflictDoUpdate({
          target: annotationFields.id,
          set: {
            curatorId: fieldData.curatorId,
            name: fieldData.name,
            description: fieldData.description,
            definitionType: fieldData.definitionType,
            definitionData: fieldData.definitionData,
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
