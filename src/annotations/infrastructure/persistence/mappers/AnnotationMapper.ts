// Placeholder for mapping between Annotation domain object and persistence layer structure

import { Annotation } from '../../../domain/aggregates/Annotation'
// Import DB schema types if needed

export class AnnotationMapper {
  public static toDomain(raw: any): Annotation {
    // TODO: Implement mapping from raw DB result (including joined relations)
    // to the Annotation aggregate root, including creating Value Objects.
    console.log('Mapping DB result to Annotation domain object:', raw)
    throw new Error('toDomain mapping not implemented')
    // Example structure:
    // const valueObject = createAnnotationValue(raw.value); // Helper to create correct VO type
    // const identifiers = raw.additionalIdentifiers?.map(id => new Identifier(id.type, id.value)) || [];
    // ... etc ...
    // return Annotation.hydrate({ // Assuming a static hydrate method on Aggregate
    //   id: new TID(raw.tid),
    //   uri: new URI(raw.uri), // Assuming URI is stored and needed
    //   url: new URI(raw.url),
    //   fieldRef: new StrongRef(raw.field.cid, raw.field.uri), // Assuming field relation is loaded
    //   value: valueObject,
    //   additionalIdentifiers: identifiers,
    //   templateRefs: raw.fromTemplates?.map(t => new StrongRef(t.template.cid, t.template.uri)), // Assuming relations loaded
    //   note: raw.note,
    //   createdAt: raw.createdAt,
    // });
  }

  public static toPersistence(annotation: Annotation): any {
    // TODO: Implement mapping from Annotation aggregate root to the structure
    // needed for DB insertion/update (e.g., main table data, related table data).
    console.log('Mapping Annotation domain object to persistence structure:', annotation)
    throw new Error('toPersistence mapping not implemented')
    // Example structure:
    // return {
    //   main: {
    //     uri: annotation.uri.toString(), // Assuming URI is generated/known
    //     tid: annotation.id.toString(),
    //     url: annotation.url.toString(),
    //     fieldUri: annotation.fieldRef.uri,
    //     value: annotation.value, // Assumes value object can be directly JSON serialized
    //     note: annotation.note,
    //     createdAt: annotation.createdAt,
    //   },
    //   identifiers: annotation.additionalIdentifiers?.map(id => ({
    //     annotationUri: annotation.uri.toString(),
    //     type: id.type,
    //     value: id.value,
    //   })) || [],
    //   templateRefs: annotation.templateRefs?.map(ref => ({
    //     annotationUri: annotation.uri.toString(),
    //     templateUri: ref.uri,
    //   })) || [],
    // };
  }
}

// Helper function example (could be more sophisticated)
// function createAnnotationValue(rawValue: any): AnnotationValue {
//    if (!rawValue || !rawValue.$type) throw new Error('Invalid raw value for AnnotationValue');
//    switch(rawValue.$type) {
//      case 'app.annos.annotation#dyadValue': return new DyadValue(rawValue.value);
//      // ... other cases ...
//      default: throw new Error(`Unknown AnnotationValue type: ${rawValue.$type}`);
//    }
// }
