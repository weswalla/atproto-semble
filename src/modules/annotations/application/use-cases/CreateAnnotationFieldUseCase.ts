// import { AnnotationField } from "../../domain/aggregates/AnnotationField";
// import { IAnnotationFieldRepository } from "../repositories/IAnnotationFieldRepository";
// import {
//   AnnotationFieldInputDTO,
//   AnnotationFieldOutputDTO,
// } from "../dtos/AnnotationFieldDTO";
// import {
//   FieldDefinition,
//   DyadFieldDef,
//   TriadFieldDef,
//   RatingFieldDef,
//   SingleSelectFieldDef,
//   MultiSelectFieldDef,
// } from "../../domain/value-objects/FieldDefinition";
// import { AnnotationFieldMapper } from "../../infrastructure/persistence/mappers/AnnotationFieldMapper";

// export class CreateAnnotationFieldUseCase {
//   constructor(private fieldRepo: IAnnotationFieldRepository) {}

//   async execute(
//     input: AnnotationFieldInputDTO
//   ): Promise<AnnotationFieldOutputDTO> {
//     // 1. Validate input DTO (Basic validation done in VOs/Aggregates for now)
//     // More complex validation could happen here.

//     // 2. Create FieldDefinition value object from input.definition
//     let definition: FieldDefinition;
//     const defInput = input.definition;
//     switch (defInput?.$type) {
//       case "app.annos.annotationField#dyadFieldDef":
//         definition = new DyadFieldDef(defInput.sideA, defInput.sideB);
//         break;
//       case "app.annos.annotationField#triadFieldDef":
//         definition = new TriadFieldDef(
//           defInput.vertexA,
//           defInput.vertexB,
//           defInput.vertexC
//         );
//         break;
//       case "app.annos.annotationField#ratingFieldDef":
//         // Lexicon defines numberOfStars as const 5, so no args needed if constructor matches
//         definition = new RatingFieldDef();
//         break;
//       case "app.annos.annotationField#singleSelectFieldDef":
//         definition = new SingleSelectFieldDef(defInput.options);
//         break;
//       case "app.annos.annotationField#multiSelectFieldDef":
//         definition = new MultiSelectFieldDef(defInput.options);
//         break;
//       default:
//         // Handle unknown or missing $type
//         // Use optional chaining for safer access
//         throw new Error(
//           `Invalid or unknown field definition type: ${defInput?.$type}`
//         );
//     }

//     // 3. Create AnnotationField aggregate using AnnotationField.create()
//     const field = AnnotationField.create({
//       name: input.name,
//       description: input.description,
//       definition: definition,
//     });

//     // 4. Persist using fieldRepo.save(field)
//     await this.fieldRepo.save(field);

//     // 5. Return result (map to Output DTO)
//     return AnnotationFieldMapper.toDTO(field);
//   }
// }
