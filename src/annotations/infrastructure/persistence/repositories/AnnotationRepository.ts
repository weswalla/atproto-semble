import { eq, and } from 'drizzle-orm'
import { db } from '../drizzle/client'
import * as schema from '../drizzle/schema'
import { IAnnotationRepository } from '../../../application/repositories/IAnnotationRepository'
import { Annotation } from '../../../domain/aggregates/Annotation'
import { TID } from '../../../../atproto/domain/value-objects/TID'
import { URI } from '../../../domain/value-objects/URI'
// Import mappers if using them
// import { AnnotationMapper } from '../mappers/AnnotationMapper'

// Placeholder Drizzle implementation of IAnnotationRepository
export class AnnotationRepository implements IAnnotationRepository {
  async findById(id: TID): Promise<Annotation | null> {
    // TID maps to the 'tid' column in the schema
    const result = await db.query.annotations.findFirst({
      where: eq(schema.annotations.tid, id.toString()),
      // Eager load relations if needed using 'with'
      // with: { field: true, fromTemplates: true, additionalIdentifiers: true }
    })
    if (!result) return null
    // TODO: Map database result to domain object (using a Mapper class is recommended)
    // return AnnotationMapper.toDomain(result);
    throw new Error('Mapping from DB to Domain not implemented')
  }

  async findByUri(uri: string): Promise<Annotation | null> {
    const result = await db.query.annotations.findFirst({
      where: eq(schema.annotations.uri, uri),
      // with: { ... }
    })
    if (!result) return null
    // TODO: Map to domain
    // return AnnotationMapper.toDomain(result);
    throw new Error('Mapping from DB to Domain not implemented')
  }

  async findByUrl(url: URI): Promise<Annotation[]> {
    const results = await db.query.annotations.findMany({
      where: eq(schema.annotations.url, url.toString()),
      // with: { ... }
    })
    // TODO: Map results to domain objects
    // return results.map(AnnotationMapper.toDomain);
    throw new Error('Mapping from DB to Domain not implemented')
  }

  async save(annotation: Annotation): Promise<void> {
    // TODO: Map domain object to database structure (using a Mapper is recommended)
    // const dbAnnotation = AnnotationMapper.toPersistence(annotation);

    // Example: Upsert logic (insert or update if exists)
    // This requires careful handling of relations (identifiers, templates)
    // await db.insert(schema.annotations)
    //   .values(dbAnnotation.main) // Assuming mapper separates main table data
    //   .onConflict(schema.annotations.uri) // Assuming URI is primary or unique key
    //   .doUpdate({ set: { ...dbAnnotation.main, updatedAt: new Date() } }); // Update fields

    // TODO: Handle saving related data (identifiers, template refs) in separate tables
    // This often involves deleting existing related records and inserting new ones within a transaction.

    console.log('Saving annotation:', annotation.id.toString())
    throw new Error('Save not implemented')
  }

  async delete(id: TID): Promise<void> {
    // Use URI derived from TID for deletion? Or just TID? Depends on schema PK.
    // Assuming deletion by TID for now. Need URI to delete relations.
    const annotation = await this.findById(id)
    if (!annotation) return // Or throw error?

    // TODO: Wrap in transaction
    // await db.transaction(async (tx) => {
    //   // Delete related records first
    //   await tx.delete(schema.annotationIdentifiers).where(eq(schema.annotationIdentifiers.annotationUri, annotation.uri));
    //   await tx.delete(schema.annotationFromTemplates).where(eq(schema.annotationFromTemplates.annotationUri, annotation.uri));
    //   // Delete main record
    //   await tx.delete(schema.annotations).where(eq(schema.annotations.tid, id.toString()));
    // });

    console.log('Deleting annotation:', id.toString())
    throw new Error('Delete not implemented')
  }
}
