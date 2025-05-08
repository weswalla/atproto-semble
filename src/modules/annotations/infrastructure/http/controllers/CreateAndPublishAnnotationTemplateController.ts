import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { CreateAndPublishAnnotationTemplateUseCase } from "../../../application/use-cases/CreateAndPublishAnnotationTemplateUseCase";
import { AuthenticatedRequest } from "src/shared/infrastructure/http/middleware";

export class CreateAndPublishAnnotationTemplateController extends Controller {
  constructor(
    private createAndPublishAnnotationTemplateUseCase: CreateAndPublishAnnotationTemplateUseCase
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { name, description, fields } = req.body;
      const curatorId = req.did;
      if (!curatorId) {
        return this.unauthorized(res);
      }

      if (!name || !description || !fields) {
        return this.badRequest(res, "Missing required parameters");
      }

      const result =
        await this.createAndPublishAnnotationTemplateUseCase.execute({
          curatorId,
          name,
          description,
          fields,
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
