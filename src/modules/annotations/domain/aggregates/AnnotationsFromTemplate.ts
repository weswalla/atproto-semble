import { AggregateRoot } from "src/shared/domain/AggregateRoot";
import { CuratorId } from "../value-objects";
import { Annotation } from "./Annotation";
import { AnnotationTemplate } from "./AnnotationTemplate";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";

interface AnnotationsFromTemplateProps {
  annotations: Annotation[];
  template: AnnotationTemplate;
  curatorId: CuratorId;
  createdAt?: Date;
}

export class AnnotationsFromTemplate extends AggregateRoot<AnnotationsFromTemplateProps> {
  private constructor(
    props: AnnotationsFromTemplateProps,
    id?: UniqueEntityID
  ) {
    super(props, id);
  }

  public static create(
    props: AnnotationsFromTemplateProps,
    id?: UniqueEntityID
  ): AnnotationsFromTemplate {
    if (
      !AnnotationsFromTemplate.annotationsAreValid(
        props.annotations,
        props.template
      )
    ) {
      throw new Error("Annotations are not valid for the template");
    }
    return new AnnotationsFromTemplate(props, id);
  }

  private static hasAllRequiredFields(
    annotations: Annotation[],
    template: AnnotationTemplate
  ): boolean {
    const requiredFields = template.getRequiredFields();
    for (const field of requiredFields) {
      const fieldId = field.fieldId;
      const annotation = annotations.find((annotation) =>
        annotation.annotationFieldId.equals(fieldId)
      );
      if (!annotation) {
        return false;
      }
    }
    return true;
  }

  private static annotationsBelongToTemplate(
    annotations: Annotation[],
    template: AnnotationTemplate
  ): boolean {
    if (annotations.length === 0) {
      return false;
    }
    
    for (const annotation of annotations) {
      const templateIds = annotation.annotationTemplateIds;
      if (!templateIds) {
        return false;
      }
      if (!templateIds.some((templateId) =>
        templateId.equals(template.templateId)
      )) {
        return false;
      }
    }
    return true;
  }

  private static annotationsAreValid(
    annotations: Annotation[],
    template: AnnotationTemplate
  ): boolean {
    if (
      !AnnotationsFromTemplate.annotationsBelongToTemplate(
        annotations,
        template
      )
    ) {
      return false;
    }
    if (!AnnotationsFromTemplate.hasAllRequiredFields(annotations, template)) {
      return false;
    }
    for (const annotation of annotations) {
      const fieldId = annotation.annotationFieldId;
      const fieldResult = template.getAnnotationFieldById(fieldId);
      if (fieldResult.isErr()) {
        return false;
      }
      const field = fieldResult.value;
      if (!annotation.value.typeMatchesDefinition(field.definition)) {
        return false;
      }
    }
    return true;
  }
}
