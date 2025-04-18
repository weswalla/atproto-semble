import { eq } from 'drizzle-orm'
import { db } from '../drizzle/client'
import * as schema from '../drizzle/schema'
import { IAnnotationTemplateRepository } from '../../../application/repositories/IAnnotationTemplateRepository'
import { AnnotationTemplate } from '../../../domain/aggregates/AnnotationTemplate'
import { TID } from '../../../../atproto/domain/value-objects/TID'
// Import mappers if using them

// Placeholder Drizzle implementation of IAnnotationTemplateRepository
export class AnnotationTemplateRepository implements IAnnotationTemplateRepository {
  async findById(id: TID): Promise<AnnotationTemplate | null> {
    const result = await db.query.annotationTemplates.findFirst({
      where: eq(schema.annotationTemplates.tid, id.toString()),
      // with: { templateFields: { with: { field: true } } } // Eager load fields
    })
    if (!result) return null
    // TODO: Map to domain
    throw new Error('Mapping from DB to Domain not implemented')
  }

  async findByUri(uri: string): Promise<AnnotationTemplate | null> {
     const result = await db.query.annotationTemplates.findFirst({
      where: eq(schema.annotationTemplates.uri, uri),
      // with: { ... }
    })
    if (!result) return null
    // TODO: Map to domain
    throw new Error('Mapping from DB to Domain not implemented')
  }

  async findByName(name: string): Promise<AnnotationTemplate | null> {
    const result = await db.query.annotationTemplates.findFirst({
      where: eq(schema.annotationTemplates.name, name),
      // with: { ... }
    })
    if (!result) return null
    // TODO: Map to domain
    throw new Error('Mapping from DB to Domain not implemented')
  }

  async save(template: AnnotationTemplate): Promise<void> {
    // TODO: Map domain to persistence
    // const dbTemplate = AnnotationTemplateMapper.toPersistence(template);

    // TODO: Wrap in transaction
    // await db.transaction(async (tx) => {
    //   // Upsert main template record
    //   await tx.insert(schema.annotationTemplates)
    //     .values(dbTemplate.main)
    //     .onConflict(...)
    //     .doUpdate(...);
    //
    //   // Handle template fields (delete existing, insert new)
    //   await tx.delete(schema.annotationTemplateFields)
    //     .where(eq(schema.annotationTemplateFields.templateUri, template.uri)); // Assuming URI is available
    //   if (dbTemplate.fields.length > 0) {
    //      await tx.insert(schema.annotationTemplateFields).values(dbTemplate.fields);
    //   }
    // });

    console.log('Saving annotation template:', template.id.toString())
    throw new Error('Save not implemented')
  }

  async delete(id: TID): Promise<void> {
    // TODO: Implement deletion, handle related templateFields entries
    // const template = await this.findById(id);
    // if (!template) return;
    // await db.transaction(async (tx) => {
    //    await tx.delete(schema.annotationTemplateFields).where(eq(schema.annotationTemplateFields.templateUri, template.uri));
    //    await tx.delete(schema.annotationTemplates).where(eq(schema.annotationTemplates.tid, id.toString()));
    // });
    console.log('Deleting annotation template:', id.toString())
    throw new Error('Delete not implemented')
  }
}
