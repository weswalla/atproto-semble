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


// --- Specific Field Definition Interfaces (from app.annos.defs) ---
interface DyadFieldDef {
  $type: 'app.annos.defs#dyadFieldDef'; // For type discrimination
  sideA: string;
  sideB: string;
}

interface TriadFieldDef {
  $type: 'app.annos.defs#triadFieldDef';
  vertexA: string;
  vertexB: string;
  vertexC: string;
}

interface RatingFieldDef {
  $type: 'app.annos.defs#ratingFieldDef';
  numberOfStars: number;
}

interface SingleSelectFieldDef {
  $type: 'app.annos.defs#singleSelectFieldDef';
  options: string[];
}

interface MultiSelectFieldDef {
  $type: 'app.annos.defs#multiSelectFieldDef';
  options: string[];
}

// Union for field definitions
type FieldDefinition =
  | DyadFieldDef
  | TriadFieldDef
  | RatingFieldDef
  | SingleSelectFieldDef
  | MultiSelectFieldDef;


// --- Consolidated Field Record Interface ---

// Represents app.annos.field#main record
interface FieldRecord {
  $type: 'app.annos.field';
  base: AnnotationFieldBase;
  definition: FieldDefinition; // Union of specific field definitions
}


// --- Specific Annotation Value Interfaces (from app.annos.defs) ---
interface DyadValue {
  $type: 'app.annos.defs#dyadValue'; // For type discrimination
  value: number; // Lexicon uses integer
  minValue: 0;
  maxValue: 1;
}

interface TriadValue {
  $type: 'app.annos.defs#triadValue';
  vertexA: number; // Lexicon uses integer
  vertexB: number;
  vertexC: number;
  sumsTo: 1;
}

interface RatingValue {
  $type: 'app.annos.defs#ratingValue';
  rating: number;
  mustbeBetween: [number, number];
}

interface SingleSelectValue {
  $type: 'app.annos.defs#singleSelectValue';
  option: string;
  mustbeOneOf: string[];
}

interface MultiSelectValue {
  $type: 'app.annos.defs#multiSelectValue';
  option: string[];
  mustbeSomeOf: string[];
}

// Union for annotation values
type AnnotationValue =
  | DyadValue
  | TriadValue
  | RatingValue
  | SingleSelectValue
  | MultiSelectValue;


// --- Consolidated Annotation Record Interface ---

// Represents app.annos.annotation#main record
interface AnnotationRecord {
  $type: 'app.annos.annotation';
  base: AnnotationBase;
  value: AnnotationValue; // Union of specific annotation values
}


// --- Template Record Interface (Remains the same conceptually) ---

// Represents app.annos.template#main record
interface AnnotationTemplateRecord {
    $type: 'app.annos.template';
    name: string;
    description: string;
    annotationFields: StrongRef[]; // Array of strong refs to field records
    createdAt?: string;
    updatedAt?: string;
}
