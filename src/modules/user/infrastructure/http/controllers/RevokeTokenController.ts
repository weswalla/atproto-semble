import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Request, Response } from "express";
import { RevokeTokenUseCase } from "../../../application/use-cases/RevokeTokenUseCase";

export class RevokeTokenController extends Controller {
  constructor(private revokeTokenUseCase: RevokeTokenUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return this.badRequest(res, "Refresh token is required");
      }

      const result = await this.revokeTokenUseCase.execute({
        refreshToken
      });

      if (result.isErr()) {
        return this.fail(res, result.error.message);
      }

      return this.ok(res);
    } catch (error) {
      return this.fail(res, error);
    }
  }
}
