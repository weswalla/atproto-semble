import { eq, sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationTemplateRepository } from "../../application/repositories/IAnnotationTemplateRepository";
import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import {
  AnnotationFieldId,
  AnnotationTemplateId,
  PublishedRecordId,
} from "../../domain/value-objects";
import {
  annotationTemplates,
  annotationTemplateFields,
} from "./schema/annotationTemplateSchema";
import { publishedRecords } from "./schema/publishedRecordSchema";
import { AnnotationTemplateMapper } from "./mappers/AnnotationTemplateMapper";
import { IAnnotationFieldRepository } from "../../application/repositories/IAnnotationFieldRepository";
import { AnnotationFieldMapper } from "./mappers/AnnotationFieldMapper";

export class DrizzleAnnotationTemplateRepository
  implements IAnnotationTemplateRepository
{
  constructor(
    private db: PostgresJsDatabase,
    private annotationFieldRepository: IAnnotationFieldRepository
  ) {}

  async findById(id: AnnotationTemplateId): Promise<AnnotationTemplate | null> {
    const templateId = id.getStringValue();

    const templateResult = await this.db
      .select({
        template: annotationTemplates,
        publishedRecord: publishedRecords,
      })
      .from(annotationTemplates)
      .leftJoin(
        publishedRecords,
        eq(annotationTemplates.publishedRecordId, publishedRecords.id)
      )
      .where(eq(annotationTemplates.id, templateId))
      .limit(1);

    if (templateResult.length === 0) {
      return null;
    }

    // Fetch the template fields
    const fieldsResult = await this.db
      .select()
      .from(annotationTemplateFields)
      .where(eq(annotationTemplateFields.templateId, templateId));

    // Fetch the actual annotation fields
    const annotationFields = await Promise.all(
      fieldsResult.map(async (field) => {
        const annotationFieldIdResult = AnnotationFieldId.createFromString(
          field.fieldId
        );
        if (annotationFieldIdResult.isErr()) {
          throw new Error(`Invalid field ID: ${field.fieldId}`);
        }
        const fieldId = annotationFieldIdResult.value;
        const annotationField =
          await this.annotationFieldRepository.findById(fieldId);
        return {
          fieldId: field.fieldId,
          required: field.required,
          field: annotationField,
        };
      })
    );

    // Filter out any null fields (in case some were deleted)
    const validFields = annotationFields
      .filter((field) => field.field !== null)
      .map((field) => {
        return {
          ...field,
          field: AnnotationFieldMapper.toPersistence(field.field!),
        };
      });

    // Map to domain object
    const result = templateResult[0];
    if (!result || !result.template) {
      throw new Error("Template not found");
    }
    
    const template = result.template;
    const publishedRecord = result.publishedRecord;
    
    const templateDTO = {
      id: template.id,
      curatorId: template.curatorId,
      name: template.name,
      description: template.description,
      createdAt: template.createdAt,
      publishedRecordId: publishedRecord
        ? { uri: publishedRecord.uri, cid: publishedRecord.cid }
        : undefined,
      fields: validFields,
    };

    const domainResult = AnnotationTemplateMapper.toDomain(templateDTO);
    if (domainResult.isErr()) {
      console.error("Error mapping template to domain:", domainResult.error);
      return null;
    }
    return domainResult.value;
  }

  async findByPublishedRecordId(
    recordId: PublishedRecordId
  ): Promise<AnnotationTemplate | null> {
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

    // Then find the template with this published record ID
    const templateResult = await this.db
      .select()
      .from(annotationTemplates)
      .where(eq(annotationTemplates.publishedRecordId, publishedRecordId))
      .limit(1);

    if (templateResult.length === 0 || !templateResult[0]) {
      return null;
    }

    // Use the findById method to get the complete template with fields
    return this.findById(
      AnnotationTemplateId.createFromString(templateResult[0].id).unwrap()
    );
  }

  async findByName(name: string): Promise<AnnotationTemplate | null> {
    const templateResult = await this.db
      .select()
      .from(annotationTemplates)
      .where(eq(annotationTemplates.name, name))
      .limit(1);

    if (templateResult.length === 0) {
      return null;
    }
    if (!templateResult[0]) {
      throw new Error("Template not found");
    }

    // Use the findById method to get the complete template with fields
    return this.findById(
      AnnotationTemplateId.createFromString(templateResult[0].id).unwrap()
    );
  }

  async save(template: AnnotationTemplate): Promise<void> {
    const { template: templateData, fields, publishedRecord } =
      AnnotationTemplateMapper.toPersistence(template);

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

      // Upsert the template
      await tx
        .insert(annotationTemplates)
        .values({
          ...templateData,
          publishedRecordId: publishedRecordId,
        })
        .onConflictDoUpdate({
          target: annotationTemplates.id,
          set: {
            curatorId: templateData.curatorId,
            name: templateData.name,
            description: templateData.description,
            publishedRecordId: publishedRecordId,
          },
        });

      // Delete existing field associations
      await tx
        .delete(annotationTemplateFields)
        .where(eq(annotationTemplateFields.templateId, templateData.id));

      // Insert new field associations
      if (fields.length > 0) {
        await tx.insert(annotationTemplateFields).values(fields);
      }
    });
  }

  async delete(id: AnnotationTemplateId): Promise<void> {
    const templateId = id.getStringValue();

    // The foreign key constraint with ON DELETE CASCADE will automatically
    // delete related records in the annotationTemplateFields table
    await this.db
      .delete(annotationTemplates)
      .where(eq(annotationTemplates.id, templateId));
  }
}
