import { AggregateRoot } from "src/shared/domain/AggregateRoot";
import { CuratorId } from "../value-objects";
import { Annotation } from "./Annotation";
import { AnnotationTemplate } from "./AnnotationTemplate";
import { UniqueEntityID } from "src/shared/domain/UniqueEntityID";
import { Result, ok, err } from "src/shared/core/Result";

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
  ): Result<AnnotationsFromTemplate, string> {
    if (
      !AnnotationsFromTemplate.annotationsAreValid(
        props.annotations,
        props.template
      )
    ) {
      return err("Annotations are not valid for the template");
    }
    return ok(new AnnotationsFromTemplate(props, id));
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

  public get annotations(): Annotation[] {
    return [...this.props.annotations];
  }

  public get template(): AnnotationTemplate {
    return this.props.template;
  }

  public markAnnotationAsPublished(
    annotationId: AnnotationId,
    publishedRecordId: PublishedRecordId
  ): Result<void, string> {
    const annotation = this.props.annotations.find((a) =>
      a.annotationId.equals(annotationId)
    );
    
    if (!annotation) {
      return err(`Annotation with ID ${annotationId.getStringValue()} not found`);
    }
    
    annotation.markAsPublished(publishedRecordId);
    return ok(undefined);
  }

  public markAllAnnotationsAsPublished(
    publishedRecordIds: Map<string, PublishedRecordId>
  ): Result<void, string> {
    for (const annotation of this.props.annotations) {
      const idString = annotation.annotationId.getStringValue();
      const publishedRecordId = publishedRecordIds.get(idString);
      
      if (!publishedRecordId) {
        return err(`Published record ID not found for annotation ${idString}`);
      }
      
      annotation.markAsPublished(publishedRecordId);
    }
    
    return ok(undefined);
  }
}
