import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IAnnotationTemplateRepository } from "../../application/repositories/IAnnotationTemplateRepository";
import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import { AnnotationTemplateId, PublishedRecordId } from "../../domain/value-objects";
import { annotationTemplates, annotationTemplateFields } from "./schema/annotationTemplateSchema";
import { AnnotationTemplateMapper } from "./mappers/AnnotationTemplateMapper";
import { IAnnotationFieldRepository } from "../../application/repositories/IAnnotationFieldRepository";

export class DrizzleAnnotationTemplateRepository implements IAnnotationTemplateRepository {
  constructor(
    private db: PostgresJsDatabase,
    private annotationFieldRepository: IAnnotationFieldRepository
  ) {}

  async findById(id: AnnotationTemplateId): Promise<AnnotationTemplate | null> {
    const templateId = id.getStringValue();
    
    // Fetch the template
    const templateResult = await this.db.select()
      .from(annotationTemplates)
      .where(eq(annotationTemplates.id, templateId))
      .limit(1);
    
    if (templateResult.length === 0) {
      return null;
    }
    
    // Fetch the template fields
    const fieldsResult = await this.db.select()
      .from(annotationTemplateFields)
      .where(eq(annotationTemplateFields.templateId, templateId));
    
    // Fetch the actual annotation fields
    const annotationFields = await Promise.all(
      fieldsResult.map(async (field) => {
        const annotationField = await this.annotationFieldRepository.findById(field.fieldId);
        return {
          fieldId: field.fieldId,
          required: field.required,
          field: annotationField
        };
      })
    );
    
    // Filter out any null fields (in case some were deleted)
    const validFields = annotationFields.filter(field => field.field !== null);
    
    // Map to domain object
    const template = templateResult[0];
    const templateDTO = {
      id: template.id,
      curatorId: template.curatorId,
      name: template.name,
      description: template.description,
      createdAt: template.createdAt,
      publishedRecordId: template.publishedRecordId,
      fields: validFields
    };
    
    const domainResult = AnnotationTemplateMapper.toDomain(templateDTO);
    return domainResult.isOk() ? domainResult.value : null;
  }

  async findByPublishedRecordId(recordId: PublishedRecordId): Promise<AnnotationTemplate | null> {
    const publishedId = recordId.getValue();
    
    const templateResult = await this.db.select()
      .from(annotationTemplates)
      .where(eq(annotationTemplates.publishedRecordId, publishedId))
      .limit(1);
    
    if (templateResult.length === 0) {
      return null;
    }
    
    // Use the findById method to get the complete template with fields
    return this.findById(AnnotationTemplateId.create(templateResult[0].id).unwrap());
  }

  async findByName(name: string): Promise<AnnotationTemplate | null> {
    const templateResult = await this.db.select()
      .from(annotationTemplates)
      .where(eq(annotationTemplates.name, name))
      .limit(1);
    
    if (templateResult.length === 0) {
      return null;
    }
    
    // Use the findById method to get the complete template with fields
    return this.findById(AnnotationTemplateId.create(templateResult[0].id).unwrap());
  }

  async save(template: AnnotationTemplate): Promise<void> {
    const { template: templateData, fields } = AnnotationTemplateMapper.toPersistence(template);
    
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
            publishedRecordId: templateData.publishedRecordId
          }
        });
      
      // Delete existing field associations
      await tx
        .delete(annotationTemplateFields)
        .where(eq(annotationTemplateFields.templateId, templateData.id));
      
      // Insert new field associations
      if (fields.length > 0) {
        await tx
          .insert(annotationTemplateFields)
          .values(fields);
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
