import { AnnotationField } from "../../../domain/AnnotationField";
import { AnnotationFieldOutputDTO } from "../../../application/dtos/AnnotationFieldDTO";

// Placeholder for mapping between AnnotationField domain object and persistence layer structure
// Import DB schema types if needed

export class AnnotationFieldMapper {
  // TODO: Implement hydrate method if needed for toDomain
  // public static hydrate(props: AnnotationFieldProps): AnnotationField {
  //   // return new AnnotationField(props); // Needs adjustment based on Aggregate design
  //   throw new Error('Hydrate method not implemented or accessible');
  // }

  public static toDomain(raw: any): AnnotationField {
    // TODO: Implement mapping from raw DB result to AnnotationField aggregate root
    console.log("Mapping DB result to AnnotationField domain object:", raw);
    throw new Error("toDomain mapping not implemented");
  }

  public static toPersistence(field: AnnotationField): any {
    // TODO: Implement mapping from AnnotationField aggregate root to DB structure
    console.log(
      "Mapping AnnotationField domain object to persistence structure:",
      field
    );
    throw new Error("toPersistence mapping not implemented");
    // Example:
    // return {
    //   uri: field.uri.toString(), // Assuming URI is known/generated
    //   tid: field.id.toString(),
    //   name: field.name,
    //   description: field.description,
    //   definition: field.definition, // Assumes definition VO can be JSON serialized
    //   createdAt: field.createdAt,
    // };
  }

  public static toDTO(field: AnnotationField): AnnotationFieldOutputDTO {
    return {
      id: field.id.toString(),
      name: field.name.value,
      description: field.description.value,
      // Assuming definition value object is structured correctly for direct use in DTO:
      definition: field.definition,
      createdAt: field.createdAt.toISOString(),
    };
  }
}
