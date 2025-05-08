import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { CreateAndPublishAnnotationsFromTemplateUseCase } from "../../../application/use-cases/CreateAndPublishAnnotationsFromTemplateUseCase";
import { AuthenticatedRequest } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export class CreateAndPublishAnnotationsFromTemplateController extends Controller {
  constructor(
    private createAndPublishAnnotationsFromTemplateUseCase: CreateAndPublishAnnotationsFromTemplateUseCase
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { url, templateId, annotations } = req.body;
      const curatorId = req.did;

      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!url || !templateId || !annotations) {
        return this.badRequest(res, "Missing required parameters");
      }

      const result = await this.createAndPublishAnnotationsFromTemplateUseCase.execute({
        curatorId,
        url,
        templateId,
        annotations
      });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.created(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
