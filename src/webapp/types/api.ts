// API response types for reuse across the application

// Template types
export interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fieldCount: number;
}

export interface TemplateField {
  id: string;
  name: string;
  description: string;
  definitionType: string;
  definition: any;
  required: boolean;
}

export interface TemplateDetail extends Omit<Template, 'fieldCount'> {
  fields: TemplateField[];
  curatorId: string;
}

// Annotation types
export interface Annotation {
  id: string;
  url: string;
  fieldName: string;
  valueType: string;
  valuePreview: string;
  createdAt: string;
  templateName?: string;
}

export interface AnnotationDetail {
  id: string;
  url: string;
  fieldName: string;
  fieldDescription: string;
  valueType: string;
  valueData: any;
  valuePreview: string;
  note?: string;
  createdAt: string;
  curatorId: string;
  templateName?: string;
  publishedRecordId?: {
    uri: string;
    cid: string;
  };
}

// API response types
export interface CreateTemplateResponse {
  templateId: string;
}

export interface CreateAnnotationsResponse {
  annotationIds: string[];
}
