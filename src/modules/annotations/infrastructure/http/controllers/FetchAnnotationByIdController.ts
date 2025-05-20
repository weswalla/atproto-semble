import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { FetchAnnotationByIdUseCase } from "../../../application/use-cases/FetchAnnotationByIdUseCase";
import { AuthenticatedRequest } from "src/shared/infrastructure/http/middleware";

export class FetchAnnotationByIdController extends Controller {
  constructor(private fetchAnnotationByIdUseCase: FetchAnnotationByIdUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const curatorId = req.did;
      if (!curatorId) {
        return this.unauthorized(res);
      }

      const { id } = req.params;
      if (!id) {
        return this.clientError(res, "Annotation ID is required");
      }

      const result = await this.fetchAnnotationByIdUseCase.execute({
        annotationId: id,
      });

      if (result.isErr()) {
        const error = result.error;
        if (error.name === "NotFoundError") {
          return this.notFound(res, error.message);
        }
        return this.fail(res, error);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
