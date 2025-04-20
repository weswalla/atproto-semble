// import { eq } from "drizzle-orm";
// import { db } from "../drizzle/client";
// import * as schema from "../drizzle/schema";
// import { IAnnotationFieldRepository } from "../../../application/repositories/IAnnotationFieldRepository";
// import { AnnotationField } from "../../../domain/aggregates/AnnotationField";
// import { TID } from "../../../../../atproto/domain/value-objects/TID";
// // Import mappers if using them

// // Placeholder Drizzle implementation of IAnnotationFieldRepository
// export class AnnotationFieldRepository implements IAnnotationFieldRepository {
//   async findById(id: TID): Promise<AnnotationField | null> {
//     const result = await db.query.annotationFields.findFirst({
//       where: eq(schema.annotationFields.tid, id.toString()),
//     });
//     if (!result) return null;
//     // TODO: Map to domain
//     throw new Error("Mapping from DB to Domain not implemented");
//   }

//   async findByUri(uri: string): Promise<AnnotationField | null> {
//     const result = await db.query.annotationFields.findFirst({
//       where: eq(schema.annotationFields.uri, uri),
//     });
//     if (!result) return null;
//     // TODO: Map to domain
//     throw new Error("Mapping from DB to Domain not implemented");
//   }

//   async findByName(name: string): Promise<AnnotationField | null> {
//     const result = await db.query.annotationFields.findFirst({
//       where: eq(schema.annotationFields.name, name),
//     });
//     if (!result) return null;
//     // TODO: Map to domain
//     throw new Error("Mapping from DB to Domain not implemented");
//   }

//   async save(field: AnnotationField): Promise<void> {
//     // TODO: Map domain to persistence
//     // const dbField = AnnotationFieldMapper.toPersistence(field);
//     // await db.insert(schema.annotationFields)
//     //   .values(dbField)
//     //   .onConflict(...)
//     //   .doUpdate(...);
//     console.log("Saving annotation field:", field.id.toString());
//     throw new Error("Save not implemented");
//   }

//   async delete(id: TID): Promise<void> {
//     // TODO: Implement deletion, consider dependencies (templates, annotations)
//     // Might need to check if field is in use before deleting or handle cascading deletes.
//     // await db.delete(schema.annotationFields).where(eq(schema.annotationFields.tid, id.toString()));
//     console.log("Deleting annotation field:", id.toString());
//     throw new Error("Delete not implemented");
//   }
// }
