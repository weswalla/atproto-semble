import { AnnotationValueType } from "./annotationValues";

// Field Definitions
export interface FieldDefinition {
  // Common properties for all field types
  type: string;
  required?: boolean;
}

export interface DyadDefinition extends FieldDefinition {
  type: "dyad";
  sideA: string;
  sideB: string;
}

export interface TriadDefinition extends FieldDefinition {
  type: "triad";
  vertexA: string;
  vertexB: string;
  vertexC: string;
}

export interface RatingDefinition extends FieldDefinition {
  type: "rating";
  numberOfStars: number;
}

export interface SingleSelectDefinition extends FieldDefinition {
  type: "singleSelect";
  options: string[];
}

export interface MultiSelectDefinition extends FieldDefinition {
  type: "multiSelect";
  options: string[];
}

export type AnnotationFieldDefinition =
  | DyadDefinition
  | TriadDefinition
  | RatingDefinition
  | SingleSelectDefinition
  | MultiSelectDefinition;

// Template Field
export interface TemplateField {
  id: string;
  name: string;
  description: string;
  definition: AnnotationFieldDefinition;
  required: boolean;
}

// Template
export interface Template {
  id?: string;
  name: string;
  description: string;
  fields: TemplateField[];
  createdAt?: Date;
}
