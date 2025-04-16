// Represents com.atproto.repo.strongRef
interface StrongRef {
  uri: string;
  cid: string;
}

// Represents app.annos.defs#identifier
interface Identifier {
  type: string;
  value: string;
}

// Represents app.annos.defs#annotationFieldBase
interface AnnotationFieldBase {
  name: string;
  description: string;
  createdAt?: string; // Optional as it's often set by PDS
}

// Represents app.annos.defs#annotationBase
interface AnnotationBase {
  url: string;
  additionalIdentifiers?: Identifier[];
  field: StrongRef; // Strong ref to a field record
  fromTemplate?: StrongRef; // Strong ref to a template record
  note?: string;
  createdAt?: string; // Optional as it's often set by PDS
  updatedAt?: string; // Optional as it's often set by PDS
}

// --- Field Record Interfaces ---

// Represents app.annos.dyad.field#main record
interface DyadFieldRecord {
  $type: 'app.annos.dyad.field';
  base: AnnotationFieldBase;
  sideA: string;
  sideB: string;
}

// Represents app.annos.triad.field#main record
interface TriadFieldRecord {
  $type: 'app.annos.triad.field';
  base: AnnotationFieldBase;
  vertexA: string;
  vertexB: string;
  vertexC: string;
}

// Represents app.annos.rating.field#main record
interface RatingFieldRecord {
  $type: 'app.annos.rating.field';
  base: AnnotationFieldBase;
  numberOfStars: number;
}

// Represents app.annos.select.field#singleSelect record
interface SingleSelectFieldRecord {
  $type: 'app.annos.select.field#singleSelect'; // Assuming specific $type if needed
  base: AnnotationFieldBase;
  options: string[];
}

// Represents app.annos.select.field#multiSelect record
interface MultiSelectFieldRecord {
  $type: 'app.annos.select.field#multiSelect'; // Assuming specific $type if needed
  base: AnnotationFieldBase;
  options: string[];
}

// Union type for any field record
type AnyAnnotationFieldRecord =
  | DyadFieldRecord
  | TriadFieldRecord
  | RatingFieldRecord
  | SingleSelectFieldRecord
  | MultiSelectFieldRecord;


// --- Annotation Record Interfaces ---

// Represents app.annos.dyad#main record
interface DyadAnnotationRecord {
  $type: 'app.annos.dyad';
  base: AnnotationBase;
  value: {
    value: number; // Note: Lexicon uses integer, adjust if float is intended
    minValue: 0;
    maxValue: 1;
  };
}

// Represents app.annos.triad#main record
interface TriadAnnotationRecord {
  $type: 'app.annos.triad';
  base: AnnotationBase;
  value: {
    vertexA: number; // Note: Lexicon uses integer
    vertexB: number;
    vertexC: number;
    sumsTo: 1;
  };
}

// Represents app.annos.rating#main record
interface RatingAnnotationRecord {
  $type: 'app.annos.rating';
  base: AnnotationBase;
  value: {
    rating: number;
    mustbeBetween: [number, number]; // e.g., [0, 5]
  };
}

// Represents app.annos.select#singleSelectAnnotation object within the union record
interface SingleSelectAnnotationRecord {
  $type: 'app.annos.select'; // Collection type
  base: AnnotationBase;
  value: {
    option: string;
    mustbeOneOf: string[];
  };
}

// Represents app.annos.select#multiSelectAnnotation object within the union record
interface MultiSelectAnnotationRecord {
  $type: 'app.annos.select'; // Collection type
  base: AnnotationBase;
  value: {
    option: string[];
    mustbeSomeOf: string[];
  };
}

// Union type for any annotation record
type AnyAnnotationRecord =
  | DyadAnnotationRecord
  | TriadAnnotationRecord
  | RatingAnnotationRecord
  | SingleSelectAnnotationRecord
  | MultiSelectAnnotationRecord;


// --- Template Record Interface ---

// Represents app.annos.template#main record
interface AnnotationTemplateRecord {
    $type: 'app.annos.template';
    name: string;
    description: string;
    annotationFields: StrongRef[]; // Array of strong refs to field records
    createdAt?: string;
    updatedAt?: string;
}
