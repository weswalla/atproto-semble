import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { FetchMyTemplatesUseCase } from "../../../application/use-cases/FetchMyTemplatesUseCase";
import { AuthenticatedRequest } from "src/shared/infrastructure/http/middleware";

export class FetchMyTemplatesController extends Controller {
  constructor(
    private fetchMyTemplatesUseCase: FetchMyTemplatesUseCase
  ) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const curatorId = req.did;
      if (!curatorId) {
        return this.unauthorized(res);
      }

      const result = await this.fetchMyTemplatesUseCase.execute({
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
