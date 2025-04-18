import { FieldDefinition } from "../value-objects/FieldDefinition";
import { TID } from "../../../../atproto/domain/value-objects/TID";

// Properties required to construct an AnnotationField
export interface AnnotationFieldProps {
  id: TID;
  name: string;
  description: string;
  definition: FieldDefinition;
  createdAt: Date;
}

// Properties required to create a new AnnotationField
export type AnnotationFieldCreateProps = Omit<
  AnnotationFieldProps,
  "id" | "createdAt"
> & {
  id?: TID; // Allow providing an ID optionally
};

// Placeholder for AnnotationField Aggregate Root
export class AnnotationField {
  readonly id: TID;
  readonly name: string;
  readonly description: string;
  readonly definition: FieldDefinition;
  readonly createdAt: Date;

  private constructor(props: AnnotationFieldProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.definition = props.definition;
    this.createdAt = props.createdAt;

    // TODO: Add more validation logic here if needed
  }

  public static create(props: AnnotationFieldCreateProps): AnnotationField {
    const id = props.id ?? TID.create();
    const createdAt = new Date();

    // TODO: Add validation for definition, name, description
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("AnnotationField name cannot be empty.");
    }
    // Add more validation as needed (e.g., description length, definition checks)

    const constructorProps: AnnotationFieldProps = {
      ...props,
      id,
      createdAt,
    };

    return new AnnotationField(constructorProps);
  }

  // Methods for business logic related to AnnotationField
}
