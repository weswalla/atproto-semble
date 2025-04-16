interface AnnotationField {
  name: string;
  description: string;
}

// Represents an identifier with a type and value.
interface Identifier {
  // The type of identifier (e.g., 'doi', 'at-uri', 'isbn').
  type: string;
  // The identifier value.
  value: string;
}

interface Annotation {
  // The primary URL identifying the annotated resource.
  url: string;
  // Optional additional identifiers for the resource.
  additionalIdentifiers?: Identifier[];
  field: Ref<AnnotationField>;
  value: any;
  fromTemplate?: Ref<AnnotationTemplate>;
  note?: string;
}

interface Ref<T> {
  id: string;
  definition: T;
}

interface DyadAnnotationField extends AnnotationField {
  sideA: string;
  sideB: string;
}

interface DyadAnnotation extends Annotation {
  field: Ref<DyadAnnotationField>;
  value: {
    value: number;
    minValue: 0;
    maxValue: 1;
  };
}

interface TriadAnnotationField extends AnnotationField {
  vertexA: string;
  vertexB: string;
  vertexC: string;
}

interface TriadAnnotation extends Annotation {
  field: Ref<TriadAnnotationField>;
  value: {
    vertexA: number;
    vertexB: number;
    vertexC: number;
    sumsTo: 1;
  };
}

interface SingleSelectAnnotationField extends AnnotationField {
  options: string[];
}

interface SingleSelectAnnotation extends Annotation {
  field: Ref<SingleSelectAnnotationField>;
  value: {
    option: string;
    mustbeOneOf: string[];
  };
}

interface MultiSelectAnnotationField extends AnnotationField {
  options: string[];
}
interface MultiSelectAnnotation extends Annotation {
  field: Ref<MultiSelectAnnotationField>;
  value: {
    option: string[];
    mustbeSomeOf: string[];
  };
}

interface StarRatingAnnotationField extends AnnotationField {
  numberOfStars: number;
}

interface StarRatingAnnotation extends Annotation {
  field: Ref<StarRatingAnnotationField>;
  value: {
    rating: number;
    mustbeBetween: [0, StarRatingAnnotationField["numberOfStars"]];
  };
}

interface AnnotationTemplate {
  annotationFields: Ref<AnnotationField>[];
}
