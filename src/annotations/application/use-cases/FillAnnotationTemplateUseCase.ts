import { IAnnotationRepository } from '../repositories/IAnnotationRepository'
import { IAnnotationFieldRepository } from '../repositories/IAnnotationFieldRepository'
import { IAnnotationTemplateRepository } from '../repositories/IAnnotationTemplateRepository'
import {
  FillAnnotationTemplateInputDTO,
  FillAnnotationTemplateOutputDTO,
} from '../dtos/FillAnnotationTemplateDTO'
import { Annotation } from '../../domain/aggregates/Annotation'
import { AnnotationTemplate } from '../../domain/aggregates/AnnotationTemplate'
import { AnnotationField } from '../../domain/aggregates/AnnotationField'
import { URI } from '../../domain/value-objects/URI'
import { StrongRef } from '../../../atproto/domain/value-objects/StrongRef'
import { Identifier } from '../../domain/value-objects/Identifier'
import {
  AnnotationValue,
  DyadValue,
  MultiSelectValue,
  RatingValue,
  SingleSelectValue,
  TriadValue,
} from '../../domain/value-objects/AnnotationValue'
import { AnnotationMapper } from '../../infrastructure/persistence/drizzle/mappers/AnnotationMapper' // Adjust path if needed

export class FillAnnotationTemplateUseCase {
  constructor(
    private annotationRepo: IAnnotationRepository,
    private fieldRepo: IAnnotationFieldRepository,
    private templateRepo: IAnnotationTemplateRepository,
  ) {}

  async execute(
    input: FillAnnotationTemplateInputDTO,
  ): Promise<FillAnnotationTemplateOutputDTO> {
    // 1. Fetch the template
    const template = await this.templateRepo.findByUri(input.templateRefUri)
    if (!template) {
      throw new Error(`AnnotationTemplate not found: ${input.templateRefUri}`)
    }
    const templateRef = new StrongRef(template.id.toString(), input.templateRefUri) // Assuming template.id is TID

    // 2. Fetch all referenced fields (simple approach: fetch one by one)
    // Optimization: Could fetch in parallel or add a findManyByUri method to repo
    const fieldsMap = new Map<string, AnnotationField>()
    const fieldRefsMap = new Map<string, StrongRef>()
    for (const templateField of template.annotationFields) {
      const fieldUri = templateField.fieldRef.uri
      const field = await this.fieldRepo.findByUri(fieldUri)
      if (!field) {
        // Decide handling: throw, skip, collect errors? Throwing for now.
        throw new Error(`AnnotationField not found: ${fieldUri}`)
      }
      fieldsMap.set(fieldUri, field)
      fieldRefsMap.set(fieldUri, templateField.fieldRef) // Store the original StrongRef from template
    }

    // 3. Validate input values against template requirements (basic)
    for (const templateField of template.annotationFields) {
      if (templateField.required && !input.values[templateField.fieldRef.uri]) {
        throw new Error(
          `Missing required field value for: ${templateField.fieldRef.uri}`,
        )
      }
    }

    // 4. Create Annotations for each provided value
    const createdAnnotations: Annotation[] = []
    const targetUrl = new URI(input.url)
    const additionalIdentifiers = input.additionalIdentifiers?.map(
      (id) => new Identifier(id.type, id.value),
    )

    for (const [fieldUri, rawValue] of Object.entries(input.values)) {
      const field = fieldsMap.get(fieldUri)
      const fieldRef = fieldRefsMap.get(fieldUri)

      if (!field || !fieldRef) {
        // This might happen if input provides a value for a field not in the template
        console.warn(`Skipping value for unknown field URI: ${fieldUri}`) // Or throw an error
        continue
      }

      // Basic validation/construction of AnnotationValue (could be more robust)
      let annotationValue: AnnotationValue
      try {
        // TODO: Add more robust validation against field.definition if needed
        switch (rawValue?.$type) {
          case 'app.annos.annotation#dyadValue':
            annotationValue = new DyadValue(rawValue.value)
            break
          case 'app.annos.annotation#triadValue':
            annotationValue = new TriadValue(
              rawValue.vertexA,
              rawValue.vertexB,
              rawValue.vertexC,
            )
            break
          case 'app.annos.annotation#ratingValue':
            annotationValue = new RatingValue(rawValue.rating)
            break
          case 'app.annos.annotation#singleSelectValue':
            annotationValue = new SingleSelectValue(rawValue.option)
            break
          case 'app.annos.annotation#multiSelectValue':
            annotationValue = new MultiSelectValue(rawValue.options)
            break
          default:
            throw new Error(`Unsupported annotation value type: ${rawValue?.$type}`)
        }
      } catch (error: any) {
        throw new Error(
          `Invalid value provided for field ${fieldUri}: ${error.message}`,
        )
      }

      const annotation = Annotation.create({
        url: targetUrl,
        fieldRef: fieldRef, // Use the StrongRef from the template/field lookup
        value: annotationValue,
        templateRefs: [templateRef], // Link back to the template being filled
        additionalIdentifiers: additionalIdentifiers,
        note: input.note,
      })
      createdAnnotations.push(annotation)
    }

    // 5. Persist all created annotations
    // TODO: Implement transactional save if possible/needed
    for (const annotation of createdAnnotations) {
      await this.annotationRepo.save(annotation)
    }

    // 6. Map to output DTOs
    // TODO: Implement or verify AnnotationMapper exists and works
    const outputAnnotations = createdAnnotations.map((anno) =>
      AnnotationMapper.toDTO(anno),
    )

    return { annotations: outputAnnotations }
  }
}
