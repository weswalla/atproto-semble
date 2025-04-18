import { FieldDefinition } from '../value-objects/FieldDefinition'
import { TID } from '../../../atproto/domain/value-objects/TID'

// Placeholder for AnnotationField Aggregate Root
export class AnnotationField {
  readonly id: TID
  readonly name: string
  readonly description: string
  readonly definition: FieldDefinition
  readonly createdAt: Date

  private constructor(props: {
    id: TID
    name: string
    description: string
    definition: FieldDefinition
    createdAt: Date
  }) {
    this.id = props.id
    this.name = props.name
    this.description = props.description
    this.definition = props.definition
    this.createdAt = props.createdAt

    // TODO: Add validation logic (e.g., name length, definition validity)
  }

  public static create(
    props: Omit<ConstructorParameters<typeof AnnotationField>[0], 'id' | 'createdAt'> & {
      id?: TID
    },
  ): AnnotationField {
    const id = props.id ?? TID.create()
    const createdAt = new Date()

    // TODO: Add validation for definition, name, description
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('AnnotationField name cannot be empty.')
    }
    // Add more validation as needed

    return new AnnotationField({ ...props, id, createdAt })
  }

  // Methods for business logic related to AnnotationField
}
