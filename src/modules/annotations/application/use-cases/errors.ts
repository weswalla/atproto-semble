import { UseCaseError } from '../../../../shared/core/UseCaseError';

export namespace UpdateAnnotationErrors {
  export class InvalidValueTypeError extends UseCaseError {
    constructor() {
      super(
        'You can only update an annotation value with the same type of value.',
      );
    }
  }
}

// Add the new namespace for CreateAndPublishAnnotationTemplateUseCase errors
export namespace CreateAndPublishAnnotationTemplateErrors {
  export class FieldCreationFailed extends UseCaseError {
    constructor(fieldName: string, error: string) {
      super(`Failed to create field "${fieldName}": ${error}`);
    }
  }

  export class FieldPublishFailed extends UseCaseError {
    constructor(fieldId: string, error: string) {
      super(`Failed to publish field "${fieldId}": ${error}`);
    }
  }

  export class FieldSaveFailed extends UseCaseError {
    constructor(fieldId: string, error: string) {
      super(`Failed to save field "${fieldId}": ${error}`);
    }
  }

  export class TemplateCreationFailed extends UseCaseError {
    constructor(error: string) {
      super(`Failed to create template: ${error}`);
    }
  }

  export class TemplatePublishFailed extends UseCaseError {
    constructor(templateId: string, error: string) {
      super(`Failed to publish template "${templateId}": ${error}`);
    }
  }

  export class TemplateSaveFailed extends UseCaseError {
    constructor(templateId: string, error: string) {
      super(`Failed to save template "${templateId}": ${error}`);
    }
  }
}
