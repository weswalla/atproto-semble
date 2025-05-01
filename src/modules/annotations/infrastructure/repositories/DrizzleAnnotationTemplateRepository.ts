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
      .select()
      .from(annotationTemplates)
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
    const template = templateResult[0];
    if (!template) {
      throw new Error("Template not found");
    }
    const templateDTO = {
      id: template.id,
      curatorId: template.curatorId,
      name: template.name,
      description: template.description,
      createdAt: template.createdAt,
      publishedRecordId: template.publishedRecordId,
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
    const publishedId = recordId.getValue();

    const templateResult = await this.db
      .select()
      .from(annotationTemplates)
      .where(eq(annotationTemplates.publishedRecordId, publishedId))
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
    const { template: templateData, fields } =
      AnnotationTemplateMapper.toPersistence(template);

    // Use a transaction to ensure atomicity
    await this.db.transaction(async (tx) => {
      // Upsert the template
      await tx
        .insert(annotationTemplates)
        .values(templateData)
        .onConflictDoUpdate({
          target: annotationTemplates.id,
          set: {
            curatorId: templateData.curatorId,
            name: templateData.name,
            description: templateData.description,
            publishedRecordId: templateData.publishedRecordId,
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
