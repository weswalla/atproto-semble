// Placeholder for mapping between AnnotationTemplate domain object and persistence layer structure

import { AnnotationTemplate } from '../../../domain/aggregates/AnnotationTemplate'
// Import DB schema types if needed

export class AnnotationTemplateMapper {
  public static toDomain(raw: any): AnnotationTemplate {
    // TODO: Implement mapping from raw DB result (including relations) to AnnotationTemplate aggregate root
    console.log('Mapping DB result to AnnotationTemplate domain object:', raw)
    throw new Error('toDomain mapping not implemented')
    // Example structure:
    // const fields = raw.templateFields?.map(tf => {
    //   const fieldRef = new StrongRef(tf.field.cid, tf.field.uri); // Assuming field relation loaded
    //   return new TemplateField(fieldRef, tf.required);
    // }) || [];
    // return AnnotationTemplate.hydrate({ // Assuming static hydrate method
    //    id: new TID(raw.tid),
    //    uri: new URI(raw.uri),
    //    name: raw.name,
    //    description: raw.description,
    //    annotationFields: fields,
    //    createdAt: raw.createdAt,
    // });
  }

  public static toPersistence(template: AnnotationTemplate): any {
    // TODO: Implement mapping from AnnotationTemplate aggregate root to DB structure
    console.log('Mapping AnnotationTemplate domain object to persistence structure:', template)
    throw new Error('toPersistence mapping not implemented')
    // Example structure:
    // return {
    //   main: {
    //     uri: template.uri.toString(), // Assuming URI known/generated
    //     tid: template.id.toString(),
    //     name: template.name,
    //     description: template.description,
    //     createdAt: template.createdAt,
    //   },
    //   fields: template.annotationFields.map(tf => ({
    //     templateUri: template.uri.toString(),
    //     fieldUri: tf.fieldRef.uri,
    //     required: tf.required,
    //   })),
    // };
  }
}
