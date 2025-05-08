import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Request, Response } from "express";
import { RefreshAccessTokenUseCase } from "../../../application/use-cases/RefreshAccessTokenUseCase";

export class RefreshAccessTokenController extends Controller {
  constructor(private refreshAccessTokenUseCase: RefreshAccessTokenUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return this.badRequest(res, "Refresh token is required");
      }

      const result = await this.refreshAccessTokenUseCase.execute({
        refreshToken,
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
