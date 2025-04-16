interface AnnotationField {
  name: string;
  description: string;
}

interface Annotation {
  field: Ref<AnnotationField>;
  value: any;
  fromTemplate?: Ref<AnnotationTemplate>;
}

interface Ref<T> {
  id: string;
  definition: T;
}

interface DyadAnnotationField extends AnnotationField {
  name: string;
  description: string;
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
  name: string;
  description: string;
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
  name: string;
  description: string;
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
  name: string;
  description: string;
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
  name: string;
  description: string;
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
  name: string;
  description: string;
  annotationFields: Ref<AnnotationField>[];
}
