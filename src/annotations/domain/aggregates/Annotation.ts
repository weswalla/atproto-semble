import { StrongRef } from '../../../atproto/domain/value-objects/StrongRef'
import { Identifier } from '../value-objects/Identifier'
import { AnnotationValue } from '../value-objects/AnnotationValue'
import { URI } from '../value-objects/URI'
import { TID } from '../../../atproto/domain/value-objects/TID' // Assuming TID is used for IDs

// Placeholder for Annotation Aggregate Root
export class Annotation {
  readonly id: TID // Assuming TID is the identifier type
  readonly url: URI
  readonly fieldRef: StrongRef // Reference to AnnotationField
  readonly value: AnnotationValue
  readonly additionalIdentifiers?: Identifier[]
  readonly templateRefs?: StrongRef[] // Reference to AnnotationTemplate(s)
  readonly note?: string
  readonly createdAt: Date // Or string depending on desired type

  // Private constructor to enforce creation via factory or repository
  private constructor(props: {
    id: TID
    url: URI
    fieldRef: StrongRef
    value: AnnotationValue
    additionalIdentifiers?: Identifier[]
    templateRefs?: StrongRef[]
    note?: string
    createdAt: Date
  }) {
    this.id = props.id
    this.url = props.url
    this.fieldRef = props.fieldRef
    this.value = props.value
    this.additionalIdentifiers = props.additionalIdentifiers
    this.templateRefs = props.templateRefs
    this.note = props.note
    this.createdAt = props.createdAt

    // TODO: Add validation logic here or in a factory
    // - Ensure value type matches field definition (requires fetching field)
  }

  // Example static factory method (could also be in a dedicated factory class)
  public static create(
    // Parameters needed to create an annotation
    props: Omit<ConstructorParameters<typeof Annotation>[0], 'id' | 'createdAt'> & {
      id?: TID // ID might be generated upon creation/persistence
    },
  ): Annotation {
    const id = props.id ?? TID.create() // Generate TID if not provided
    const createdAt = new Date() // Set creation timestamp

    // TODO: Add complex validation logic, potentially involving fetching the AnnotationField
    // to ensure the value type is compatible with the field definition.
    // This might belong in an Application Service/UseCase.

    return new Annotation({ ...props, id, createdAt })
  }

  // Methods for business logic related to Annotation
}
