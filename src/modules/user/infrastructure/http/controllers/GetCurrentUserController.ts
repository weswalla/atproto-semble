import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Response } from "express";
import { GetCurrentUserUseCase } from "../../../application/use-cases/GetCurrentUserUseCase";
import { AuthenticatedRequest } from "../../../../../shared/infrastructure/http/middleware/AuthMiddleware";

export class GetCurrentUserController extends Controller {
  constructor(private getCurrentUserUseCase: GetCurrentUserUseCase) {
    super();
  }

  async executeImpl(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      if (!req.did) {
        return this.unauthorized(res);
      }

      const result = await this.getCurrentUserUseCase.execute({
        did: req.did,
      });

      if (result.isErr()) {
        return this.fail(res, result.error.message);
      }

      return this.ok(res, result.value);
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
