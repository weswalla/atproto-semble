import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Request, Response } from "express";
import { InitiateOAuthSignInUseCase } from "../../../application/use-cases/InitiateOAuthSignInUseCase";

export class InitiateOAuthSignInController extends Controller {
  constructor(private initiateOAuthSignInUseCase: InitiateOAuthSignInUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { handle } = req.query;

      const result = await this.initiateOAuthSignInUseCase.execute({
        handle: handle as string | undefined,
      });

      if (result.isErr()) {
        return this.fail(res, result.error as any);
      }

      return this.ok(res, { authUrl: result.value });
    } catch (error: any) {
      return this.fail(res, error);
    }
  }
}
