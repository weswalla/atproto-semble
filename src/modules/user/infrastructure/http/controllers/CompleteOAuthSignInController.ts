import { Controller } from "../../../../../shared/infrastructure/http/Controller";
import { Request, Response } from "express";
import { CompleteOAuthSignInUseCase } from "../../../application/use-cases/CompleteOAuthSignInUseCase";

export class CompleteOAuthSignInController extends Controller {
  constructor(private completeOAuthSignInUseCase: CompleteOAuthSignInUseCase) {
    super();
  }

  async executeImpl(req: Request, res: Response): Promise<any> {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return this.badRequest(res, "Missing required parameters");
      }

      const result = await this.completeOAuthSignInUseCase.execute({
        code: code as string,
        state: state as string
      });

      if (result.isErr()) {
        return this.fail(res, result.error.message);
      }

      return this.ok(res, result.value);
    } catch (error) {
      return this.fail(res, error);
    }
  }
}
