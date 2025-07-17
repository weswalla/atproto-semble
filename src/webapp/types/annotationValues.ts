// Annotation Value Types
export interface AnnotationValue {
  // Common properties for all value types
  type: string;
}

export interface DyadValue extends AnnotationValue {
  type: 'dyad';
  value: number;
}

export interface TriadValue extends AnnotationValue {
  type: 'triad';
  vertexA: number;
  vertexB: number;
  vertexC: number;
}

export interface RatingValue extends AnnotationValue {
  type: 'rating';
  rating: number;
}

export interface SingleSelectValue extends AnnotationValue {
  type: 'singleSelect';
  option: string;
}

export interface MultiSelectValue extends AnnotationValue {
  type: 'multiSelect';
  options: string[];
}

export type AnnotationValueType =
  | DyadValue
  | TriadValue
  | RatingValue
  | SingleSelectValue
  | MultiSelectValue;
