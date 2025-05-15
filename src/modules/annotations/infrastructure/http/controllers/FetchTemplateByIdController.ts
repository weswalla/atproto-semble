import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { FetchTemplateByIdUseCase } from "../../../application/use-cases/FetchTemplateByIdUseCase";
import { AuthenticatedRequest } from "src/shared/infrastructure/http/middleware";

export class FetchTemplateByIdController extends Controller {
  constructor(
    private fetchTemplateByIdUseCase: FetchTemplateByIdUseCase
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      
      if (!id) {
        return this.badRequest(res, "Template ID is required");
      }

      const result = await this.fetchTemplateByIdUseCase.execute({
        templateId: id,
      });

      if (result.isErr()) {
        if (result.error instanceof Error && result.error.name === "NotFoundError") {
          return this.notFound(res, result.error.message);
        }
        return this.fail(res, result.error as any);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
