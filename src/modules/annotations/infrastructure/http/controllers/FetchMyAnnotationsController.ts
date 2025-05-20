import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { FetchMyAnnotationsUseCase } from "../../../application/use-cases/FetchMyAnnotationsUseCase";
import { AuthenticatedRequest } from "src/shared/infrastructure/http/middleware";

export class FetchMyAnnotationsController extends Controller {
  constructor(
    private fetchMyAnnotationsUseCase: FetchMyAnnotationsUseCase
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const curatorId = req.did;
      if (!curatorId) {
        return this.unauthorized(res);
      }

      const result = await this.fetchMyAnnotationsUseCase.execute({
        curatorId,
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
