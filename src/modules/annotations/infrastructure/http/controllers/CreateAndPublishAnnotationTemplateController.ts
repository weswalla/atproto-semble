import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Request, Response } from "express";
import { CreateAndPublishAnnotationTemplateUseCase } from "../../../application/use-cases/CreateAndPublishAnnotationTemplateUseCase";

export class CreateAndPublishAnnotationTemplateController extends Controller {
  constructor(
    private createAndPublishAnnotationTemplateUseCase: CreateAndPublishAnnotationTemplateUseCase
  ) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { curatorId, name, description, fields } = req.body;

      if (!curatorId || !name || !description || !fields) {
        return this.badRequest(res, "Missing required parameters");
      }

      const result = await this.createAndPublishAnnotationTemplateUseCase.execute({
        curatorId,
        name,
        description,
        fields
      });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
