import { StrongRef } from '../../../atproto/domain/value-objects/StrongRef'
import { Identifier } from '../value-objects/Identifier'
import { AnnotationValue } from '../value-objects/AnnotationValue'
import { URI } from '../value-objects/URI'
import { TID } from '../../../atproto/domain/value-objects/TID'

// Properties required to construct an Annotation
export interface AnnotationProps {
  id: TID
  url: URI
  fieldRef: StrongRef
  value: AnnotationValue
  additionalIdentifiers?: Identifier[]
  templateRefs?: StrongRef[]
  note?: string
  createdAt: Date
}

// Properties required to create a new Annotation (ID and createdAt are generated)
export type AnnotationCreateProps = Omit<AnnotationProps, 'id' | 'createdAt'> & {
  id?: TID // Allow providing an ID optionally
}

// Placeholder for Annotation Aggregate Root
export class Annotation {
  readonly id: TID
  readonly url: URI
  readonly fieldRef: StrongRef // Reference to AnnotationField
  readonly value: AnnotationValue
  readonly additionalIdentifiers?: Identifier[]
  readonly templateRefs?: StrongRef[] // Reference to AnnotationTemplate(s)
  readonly note?: string
  readonly createdAt: Date

  // Private constructor to enforce creation via factory or repository
  private constructor(props: AnnotationProps) {
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

  // Factory method for creating new Annotation instances
  public static create(props: AnnotationCreateProps): Annotation {
    const id = props.id ?? TID.create() // Generate TID if not provided
    const createdAt = new Date() // Set creation timestamp

    // TODO: Add complex validation logic, potentially involving fetching the AnnotationField
    // to ensure the value type is compatible with the field definition.
    // This validation might be better suited for an Application Service/UseCase
    // that has access to repositories.

    // Construct the full props object for the private constructor
    const constructorProps: AnnotationProps = {
      ...props, // Spread properties from create input (url, fieldRef, value, etc.)
      id,       // Use the generated or provided ID
      createdAt, // Use the generated timestamp
    }

    return new Annotation(constructorProps)
  }

  // Methods for business logic related to Annotation
}
