import { AnnotationTemplate } from "../../domain/aggregates/AnnotationTemplate";
import {
  AnnotationTemplateId,
  CuratorId,
  PublishedRecordId,
} from "../../domain/value-objects";

export interface IAnnotationTemplateRepository {
  findById(id: AnnotationTemplateId): Promise<AnnotationTemplate | null>;
  findByPublishedRecordId(
    recordId: PublishedRecordId
  ): Promise<AnnotationTemplate | null>;
  findByName(name: string): Promise<AnnotationTemplate | null>;
  findByCuratorId(curatorId: CuratorId): Promise<AnnotationTemplate[]>;
  save(template: AnnotationTemplate): Promise<void>;
  delete(id: AnnotationTemplateId): Promise<void>;
}
